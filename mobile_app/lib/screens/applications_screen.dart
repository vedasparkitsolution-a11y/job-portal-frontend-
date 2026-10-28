import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/user_model.dart';
import '../models/application_model.dart';
import '../services/api_service.dart';

class ApplicationsScreen extends StatefulWidget {
  final UserModel user;

  const ApplicationsScreen({super.key, required this.user});

  @override
  State<ApplicationsScreen> createState() => _ApplicationsScreenState();
}

class _ApplicationsScreenState extends State<ApplicationsScreen> {
  List<ApplicationModel> _apps = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadApplications();
  }

  Future<void> _loadApplications() async {
    setState(() => _isLoading = true);
    final apps = await ApiService.fetchMyApplications(widget.user.id);
    if (!mounted) return;
    setState(() {
      _apps = apps;
      _isLoading = false;
    });
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'shortlisted':
        return AppColors.success;
      case 'reviewed':
      case 'under review':
        return AppColors.info;
      case 'rejected':
        return AppColors.danger;
      case 'hired':
        return const Color(0xFF8B5CF6);
      default:
        return AppColors.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Applications'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadApplications,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _apps.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.assignment_outlined, size: 54, color: AppColors.textMuted),
                      const SizedBox(height: 12),
                      Text('No submitted applications yet', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 6),
                      const Text('Browse job openings and click Apply to track them here.', style: TextStyle(color: AppColors.textMuted)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _apps.length,
                  itemBuilder: (context, index) {
                    final app = _apps[index];
                    final color = _getStatusColor(app.status);

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    app.jobTitle,
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: color.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: color.withOpacity(0.3)),
                                  ),
                                  child: Text(
                                    app.status.toUpperCase(),
                                    style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 11),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text('${app.companyName} • ${app.location}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                            const SizedBox(height: 10),
                            Text('Applied on: ${app.appliedAt}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
