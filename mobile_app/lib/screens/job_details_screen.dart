import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/job_model.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class JobDetailsScreen extends StatefulWidget {
  final JobModel job;
  final UserModel user;

  const JobDetailsScreen({super.key, required this.job, required this.user});

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen> {
  bool _isApplying = false;

  void _showApplyModal() {
    final coverLetterController = TextEditingController(text: 'Hello, I am enthusiastic about applying for the ${widget.job.title} role at ${widget.job.companyName}. My experience and skills match your requirements.');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (modalContext) {
        return Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(modalContext).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Apply for ${widget.job.title}', style: Theme.of(modalContext).textTheme.titleLarge),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(modalContext),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text('Applying as: ${widget.user.name ?? "Jobseeker"} (${widget.user.email})', style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
              const SizedBox(height: 16),
              const Text('Cover Letter / Pitch (Optional):', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextField(
                controller: coverLetterController,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Share why you are a great fit for this job...',
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(modalContext);
                    setState(() => _isApplying = true);

                    final res = await ApiService.applyForJob(
                      jobId: widget.job.id,
                      candidateId: widget.user.id,
                      coverLetter: coverLetterController.text.trim(),
                      candidateName: widget.user.name,
                      email: widget.user.email,
                      phone: widget.user.phone,
                    );

                    if (!mounted) return;
                    setState(() => _isApplying = false);

                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(res['message'] ?? '🎉 Application submitted successfully!'),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  },
                  child: const Text('Submit Application 🚀'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final j = widget.job;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.bookmark_border_rounded),
            onPressed: () async {
              final ok = await ApiService.saveJob(j.id, widget.user.id);
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(ok ? 'Job saved!' : 'Failed to save job')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Company logo & header
            Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.primary50,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      j.companyName.isNotEmpty ? j.companyName[0].toUpperCase() : 'C',
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 24),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(j.title, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 20)),
                      const SizedBox(height: 4),
                      Text(j.companyName, style: const TextStyle(fontSize: 15, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Pills grid
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildInfoPill(Icons.location_on_outlined, j.location),
                _buildInfoPill(Icons.work_outline, j.jobType),
                _buildInfoPill(Icons.payments_outlined, j.salary),
                _buildInfoPill(Icons.star_outline_rounded, '${j.matchScore}% Match'),
              ],
            ),
            const SizedBox(height: 24),

            const Divider(color: AppColors.border),
            const SizedBox(height: 16),

            // Job Description
            Text('Job Overview', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              j.description,
              style: const TextStyle(fontSize: 14, height: 1.6, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 24),

            // Required Skills
            if (j.requiredSkills.isNotEmpty) ...[
              Text('Required Skills', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: j.requiredSkills.split(',').map((sk) {
                  return Chip(
                    label: Text(sk.trim(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    backgroundColor: AppColors.primary50,
                    side: BorderSide.none,
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
            ],

            // Company card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('About the Company', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    const SizedBox(height: 6),
                    Text('${j.companyName} is a verified hiring employer on JobConnect.', style: const TextStyle(color: AppColors.textSecondary)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          boxShadow: [
            BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -2)),
          ],
        ),
        child: SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isApplying ? null : _showApplyModal,
            child: _isApplying
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text('Apply for this Job 🚀', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoPill(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.inputBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.primary),
          const SizedBox(width: 6),
          Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
