import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/user_model.dart';
import '../models/job_model.dart';
import '../services/api_service.dart';
import 'job_details_screen.dart';

class SavedJobsScreen extends StatefulWidget {
  final UserModel user;

  const SavedJobsScreen({super.key, required this.user});

  @override
  State<SavedJobsScreen> createState() => _SavedJobsScreenState();
}

class _SavedJobsScreenState extends State<SavedJobsScreen> {
  List<JobModel> _savedJobs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSaved();
  }

  Future<void> _loadSaved() async {
    setState(() => _isLoading = true);
    final jobs = await ApiService.fetchSavedJobs(widget.user.id);
    if (!mounted) return;
    setState(() {
      _savedJobs = jobs;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bookmarked Jobs'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadSaved,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _savedJobs.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.bookmark_outline_rounded, size: 54, color: AppColors.textMuted),
                      const SizedBox(height: 12),
                      Text('No bookmarked jobs yet', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 6),
                      const Text('Tap the bookmark icon on any job card to save it for later.', style: TextStyle(color: AppColors.textMuted)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _savedJobs.length,
                  itemBuilder: (context, index) {
                    final job = _savedJobs[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        title: Text(job.title, style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text('${job.companyName} • ${job.location}'),
                            const SizedBox(height: 4),
                            Text(job.salary, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
                          ],
                        ),
                        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppColors.textMuted),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => JobDetailsScreen(job: job, user: widget.user)),
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
