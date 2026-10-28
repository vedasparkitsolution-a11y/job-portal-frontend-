import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class EmployerDashboardScreen extends StatefulWidget {
  final UserModel user;

  const EmployerDashboardScreen({super.key, required this.user});

  @override
  State<EmployerDashboardScreen> createState() => _EmployerDashboardScreenState();
}

class _EmployerDashboardScreenState extends State<EmployerDashboardScreen> {
  final _titleController = TextEditingController();
  final _locationController = TextEditingController(text: 'Bangalore');
  final _salaryController = TextEditingController(text: '₹8,00,000 - ₹12,00,000');
  final _skillsController = TextEditingController(text: 'Flutter, Dart, REST API');
  final _descController = TextEditingController(text: 'We are seeking a talented Mobile Developer to build cross-platform applications.');

  bool _isPosting = false;

  void _showPostJobModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Post a New Job Opening', style: Theme.of(ctx).textTheme.titleLarge),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _titleController,
                  decoration: const InputDecoration(labelText: 'Job Title (e.g. Senior Flutter Developer)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _locationController,
                  decoration: const InputDecoration(labelText: 'Job Location / City'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _salaryController,
                  decoration: const InputDecoration(labelText: 'Salary Range'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _skillsController,
                  decoration: const InputDecoration(labelText: 'Required Skills (comma-separated)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _descController,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Job Description'),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (_titleController.text.trim().isEmpty) return;
                      Navigator.pop(ctx);
                      setState(() => _isPosting = true);

                      final res = await ApiService.postEmployerJob({
                        'job_title': _titleController.text.trim(),
                        'company_name': widget.user.companyName ?? 'Tech Employer',
                        'job_location': _locationController.text.trim(),
                        'city': _locationController.text.trim(),
                        'salary': _salaryController.text.trim(),
                        'required_skills': _skillsController.text.trim(),
                        'job_description': _descController.text.trim(),
                        'employer_id': widget.user.id,
                      });

                      if (!mounted) return;
                      setState(() => _isPosting = false);

                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(res['message'] ?? '🎉 Job posted successfully!'),
                          backgroundColor: AppColors.success,
                        ),
                      );
                    },
                    child: const Text('Publish Job Posting 🚀'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.user.companyName ?? 'Employer Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primary),
            onPressed: _showPostJobModal,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stats cards
            Row(
              children: [
                Expanded(child: _buildStatCard('Active Jobs', '12', Icons.work_rounded, AppColors.primary)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('Applicants', '148', Icons.people_rounded, AppColors.accent)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildStatCard('Shortlisted', '24', Icons.stars_rounded, AppColors.success)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('Interviews', '8', Icons.event_available_rounded, AppColors.warning)),
              ],
            ),
            const SizedBox(height: 24),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Active Job Listings', style: Theme.of(context).textTheme.titleLarge),
                ElevatedButton.icon(
                  onPressed: _showPostJobModal,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Post Job'),
                ),
              ],
            ),
            const SizedBox(height: 16),

            _buildEmployerJobItem('Senior Flutter Mobile Engineer', 'Bangalore • Full Time', '48 Applicants', 'Active'),
            _buildEmployerJobItem('Backend Node.js Architect', 'Remote • Full Time', '32 Applicants', 'Active'),
            _buildEmployerJobItem('UI/UX Product Designer', 'Mumbai • Hybrid', '68 Applicants', 'Active'),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String count, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 10),
            Text(count, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 24)),
            const SizedBox(height: 2),
            Text(title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildEmployerJobItem(String title, String subtitle, String appsCount, String status) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(subtitle),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.people_outline, size: 14, color: AppColors.primary),
                const SizedBox(width: 4),
                Text(appsCount, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 12)),
              ],
            ),
          ],
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.success.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(status, style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w800, fontSize: 11)),
        ),
      ),
    );
  }
}
