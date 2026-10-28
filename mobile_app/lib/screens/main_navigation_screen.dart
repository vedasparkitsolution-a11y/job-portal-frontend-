import 'package:flutter/material.dart';
import '../models/user_model.dart';
import 'home_feed_screen.dart';
import 'nearby_jobs_screen.dart';
import 'saved_jobs_screen.dart';
import 'applications_screen.dart';
import 'profile_screen.dart';
import 'employer_dashboard_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  final UserModel user;

  const MainNavigationScreen({super.key, required this.user});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final isEmployer = widget.user.role == 'company';

    final List<Widget> candidateScreens = [
      HomeFeedScreen(user: widget.user),
      NearbyJobsScreen(user: widget.user),
      SavedJobsScreen(user: widget.user),
      ApplicationsScreen(user: widget.user),
      ProfileScreen(user: widget.user),
    ];

    final List<Widget> employerScreens = [
      EmployerDashboardScreen(user: widget.user),
      HomeFeedScreen(user: widget.user),
      ProfileScreen(user: widget.user),
    ];

    final activeScreens = isEmployer ? employerScreens : candidateScreens;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex >= activeScreens.length ? 0 : _currentIndex,
        children: activeScreens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex >= activeScreens.length ? 0 : _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: isEmployer
            ? const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard_rounded),
                  label: 'Employer',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.search_rounded),
                  label: 'Browse Jobs',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.person_rounded),
                  label: 'Profile',
                ),
              ]
            : const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.explore_rounded),
                  label: 'Explore',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.near_me_rounded),
                  label: 'Nearby',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.bookmark_outline_rounded),
                  activeIcon: Icon(Icons.bookmark_rounded),
                  label: 'Saved',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.assignment_turned_in_outlined),
                  activeIcon: Icon(Icons.assignment_turned_in_rounded),
                  label: 'Applications',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.person_outline_rounded),
                  activeIcon: Icon(Icons.person_rounded),
                  label: 'Profile',
                ),
              ],
      ),
    );
  }
}
