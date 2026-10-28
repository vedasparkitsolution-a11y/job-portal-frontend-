import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'main_navigation_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _scaleAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _controller.forward();
    _initApp();
  }

  Future<void> _initApp() async {
    await ApiService.fetchConfig();
    await Future.delayed(const Duration(milliseconds: 1800));

    if (!mounted) return;
    final savedUser = await ApiService.getSavedUser();
    if (savedUser != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => MainNavigationScreen(user: savedUser)),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext me) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.primaryGradient,
        ),
        child: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return FadeTransition(
                opacity: _fadeAnim,
                child: ScaleTransition(
                  scale: _scaleAnim,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.15),
                              blurRadius: 24,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.work_outline_rounded,
                          size: 54,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 24),
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: 'Job',
                              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                    color: Colors.white,
                                    fontSize: 32,
                                    fontWeight: FontWeight.w900,
                                  ),
                            ),
                            TextSpan(
                              text: 'Connect',
                              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                    color: AppColors.primary100,
                                    fontSize: 32,
                                    fontWeight: FontWeight.w900,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'India\'s #1 AI-Powered Career Platform',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                      ),
                      const SizedBox(height: 48),
                      const CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        strokeWidth: 2.5,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
