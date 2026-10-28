import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  final UserModel user;

  const ProfileScreen({super.key, required this.user});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _profileData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final data = await ApiService.fetchCandidateProfile(widget.user.id);
    if (!mounted) return;
    setState(() {
      _profileData = data;
      _isLoading = false;
    });
  }

  Future<void> _handleLogout() async {
    await ApiService.clearAuthSession();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final u = widget.user;
    final completionPct = _profileData?['profile_completion_percentage'] ?? u.profileCompletionPercentage;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Account & Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.danger),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // User Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(20),
                boxShadow: const [
                  BoxShadow(color: AppColors.primaryGlow, blurRadius: 16, offset: Offset(0, 6)),
                ],
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: Colors.white,
                    child: Text(
                      (u.name != null && u.name!.isNotEmpty) ? u.name![0].toUpperCase() : 'U',
                      style: const TextStyle(color: AppColors.primaryDark, fontWeight: FontWeight.w800, fontSize: 28),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    u.name ?? 'Candidate Profile',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 20),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    u.email,
                    style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Role: ${u.role.toUpperCase()}',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Profile Completion Progress Bar
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Profile Strength', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                        Text('$completionPct%', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: completionPct / 100,
                        backgroundColor: AppColors.primary100,
                        color: AppColors.primary,
                        minHeight: 8,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Profile Sections
            _buildSectionTile(Icons.school_outlined, 'Education & Qualifications', 'B.Tech / MCA Computer Science'),
            _buildSectionTile(Icons.work_outline_rounded, 'Work Experience', '2.5 Years Senior Software Developer'),
            _buildSectionTile(Icons.psychology_outlined, 'Skills & Certifications', 'React, Flutter, Node.js, SQL, REST APIs'),
            _buildSectionTile(Icons.description_outlined, 'Resume / CV Document', 'Resume_2026.pdf (Verified)'),
            _buildSectionTile(Icons.settings_outlined, 'Account Preferences', 'Theme, Notifications & Security'),

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.danger),
                  foregroundColor: AppColors.danger,
                ),
                onPressed: _handleLogout,
                icon: const Icon(Icons.logout),
                label: const Text('Sign Out from Account'),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTile(IconData icon, String title, String subtitle) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary50,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Viewing $title details')),
          );
        },
      ),
    );
  }
}
