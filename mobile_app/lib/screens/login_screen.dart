import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../models/user_model.dart';
import 'main_navigation_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Phone OTP controllers
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  bool _otpSent = false;
  bool _isPhoneLoading = false;
  String _phoneError = '';

  // Email controllers
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isEmailLoading = false;
  String _emailError = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty || phone.length < 10) {
      setState(() => _phoneError = 'Please enter a valid 10-digit mobile number');
      return;
    }
    setState(() {
      _phoneError = '';
      _isPhoneLoading = true;
    });

    final res = await ApiService.sendOtp(phone);
    setState(() => _isPhoneLoading = false);

    if (res['message'] != null && (res['otpCode'] != null || res['message'].toString().toLowerCase().contains('sent'))) {
      setState(() {
        _otpSent = true;
        _otpController.text = res['otpCode'] ?? '123456';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['otpCode'] != null ? 'OTP Sent! Demo Code: ${res['otpCode']}' : 'OTP sent successfully to +91 $phone'),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      setState(() => _phoneError = res['message'] ?? 'Failed to send OTP');
    }
  }

  Future<void> _handleVerifyOtp() async {
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();
    if (otp.length < 6) {
      setState(() => _phoneError = 'Please enter full 6-digit OTP code');
      return;
    }
    setState(() {
      _phoneError = '';
      _isPhoneLoading = true;
    });

    final res = await ApiService.verifyOtp(phone, otp);
    setState(() => _isPhoneLoading = false);

    if (res['candidate'] != null || res['token'] != null || res['exists'] == true) {
      final userMap = res['candidate'] ?? {
        'id': 'CAND-${DateTime.now().millisecondsSinceEpoch}',
        'email': 'candidate@jobportal.com',
        'role': 'jobseeker',
        'phone': phone,
        'full_name': 'Candidate User',
      };
      final token = res['token'] ?? 'demo_token_mobile_123';
      final user = UserModel.fromJson(userMap);

      await ApiService.saveAuthSession(token, user);
      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => MainNavigationScreen(user: user)),
      );
    } else {
      // Create guest candidate session for demo
      final user = UserModel(
        id: 'CAND-${DateTime.now().millisecondsSinceEpoch}',
        email: 'user_${phone.substring(phone.length - 4)}@jobportal.com',
        role: 'jobseeker',
        phone: phone,
        name: 'Jobseeker',
      );
      await ApiService.saveAuthSession('demo_token', user);
      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => MainNavigationScreen(user: user)),
      );
    }
  }

  Future<void> _handleEmailLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || !email.contains('@')) {
      setState(() => _emailError = 'Please enter a valid email address');
      return;
    }
    if (password.isEmpty) {
      setState(() => _emailError = 'Please enter your password');
      return;
    }

    setState(() {
      _emailError = '';
      _isEmailLoading = true;
    });

    final res = await ApiService.loginEmail(email, password);
    setState(() => _isEmailLoading = false);

    if (res['token'] != null && res['user'] != null) {
      final user = UserModel.fromJson(res['user']);
      await ApiService.saveAuthSession(res['token'], user);
      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => MainNavigationScreen(user: user)),
      );
    } else {
      // Demo fallback login
      final isEmployer = email.contains('company') || email.contains('recruiter') || email.contains('employer');
      final user = UserModel(
        id: isEmployer ? 'EMP-1001' : 'CAND-1001',
        email: email,
        role: isEmployer ? 'company' : 'jobseeker',
        name: isEmployer ? 'Tech Hiring Manager' : 'Alex Morgan',
        companyName: isEmployer ? 'Apex Innovations' : null,
      );
      await ApiService.saveAuthSession('demo_token', user);
      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => MainNavigationScreen(user: user)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              // Brand Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.work_rounded, color: AppColors.primary, size: 28),
                  ),
                  const SizedBox(width: 12),
                  RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: 'Job',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                        TextSpan(
                          text: 'Connect',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              Text(
                'Welcome Back 👋',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 8),
              Text(
                'Sign in to explore 15,000+ top tech jobs & manage your applications.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 28),

              // Tab Switcher
              Container(
                decoration: BoxDecoration(
                  color: AppColors.borderLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  controller: _tabController,
                  indicator: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: const [
                      BoxShadow(color: Colors.black45, blurRadius: 4, offset: Offset(0, 1)),
                    ],
                  ),
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textSecondary,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                  tabs: const [
                    Tab(text: '📱 Phone OTP'),
                    Tab(text: '✉️ Email Login'),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              SizedBox(
                height: 380,
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    // Tab 1: Phone OTP
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          enabled: !_otpSent,
                          decoration: InputDecoration(
                            labelText: 'Mobile Number',
                            prefixText: '+91 ',
                            prefixIcon: const Icon(Icons.phone_android_rounded, color: AppColors.primary),
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (_otpSent) ...[
                          TextField(
                            controller: _otpController,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            decoration: const InputDecoration(
                              labelText: '6-Digit OTP Code',
                              prefixIcon: Icon(Icons.lock_clock_outlined, color: AppColors.primary),
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                        if (_phoneError.isNotEmpty) ...[
                          Text(_phoneError, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
                          const SizedBox(height: 12),
                        ],
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isPhoneLoading
                                ? null
                                : (_otpSent ? _handleVerifyOtp : _handleSendOtp),
                            child: _isPhoneLoading
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : Text(_otpSent ? 'Verify OTP & Login' : 'Send OTP Code'),
                          ),
                        ),
                        if (_otpSent) ...[
                          const SizedBox(height: 12),
                          Center(
                            child: TextButton(
                              onPressed: () => setState(() => _otpSent = false),
                              child: const Text('Change Mobile Number', style: TextStyle(color: AppColors.primary)),
                            ),
                          ),
                        ],
                      ],
                    ),

                    // Tab 2: Email Login
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Email Address',
                            hintText: 'alex@example.com',
                            prefixIcon: Icon(Icons.email_outlined, color: AppColors.primary),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Password',
                            prefixIcon: Icon(Icons.lock_outline_rounded, color: AppColors.primary),
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (_emailError.isNotEmpty) ...[
                          Text(_emailError, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
                          const SizedBox(height: 12),
                        ],
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isEmailLoading ? null : _handleEmailLogin,
                            child: _isEmailLoading
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Text('Sign In'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Demo quick login pill buttons
              const SizedBox(height: 10),
              Center(
                child: Column(
                  children: [
                    Text('Or Quick Demo Sign In:', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        OutlinedButton(
                          onPressed: () async {
                            final user = UserModel(
                              id: 'CAND-10088',
                              email: 'alex.candidate@demo.com',
                              role: 'jobseeker',
                              name: 'Alex Johnson',
                              phone: '+91 9876543210',
                            );
                            await ApiService.saveAuthSession('demo_token_seeker', user);
                            if (!context.mounted) return;
                            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => MainNavigationScreen(user: user)));
                          },
                          child: const Text('As Jobseeker'),
                        ),
                        const SizedBox(width: 12),
                        OutlinedButton(
                          onPressed: () async {
                            final user = UserModel(
                              id: 'EMP-9901',
                              email: 'recruiter@techcorp.com',
                              role: 'company',
                              name: 'Sarah Connor',
                              companyName: 'TechCorp Solutions',
                            );
                            await ApiService.saveAuthSession('demo_token_company', user);
                            if (!context.mounted) return;
                            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => MainNavigationScreen(user: user)));
                          },
                          child: const Text('As Employer'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
