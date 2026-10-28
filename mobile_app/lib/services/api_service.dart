import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/job_model.dart';
import '../models/user_model.dart';
import '../models/application_model.dart';

class ApiService {
  // Default Base URL (10.0.2.2 for Android Emulator, localhost for iOS Simulator)
  static String baseUrl = 'http://10.0.2.2:5000/api';

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<void> saveAuthSession(String token, UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('user_data', jsonEncode(user.toJson()));
  }

  static Future<UserModel?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('user_data');
    if (data != null) {
      try {
        return UserModel.fromJson(jsonDecode(data));
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  static Future<void> clearAuthSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
  }

  static Map<String, String> _headers(String? token) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Mobile App Config
  static Future<Map<String, dynamic>> fetchConfig() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/mobile/config')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      // Fallback localhost attempt
      try {
        baseUrl = 'http://localhost:5000/api';
        final res = await http.get(Uri.parse('$baseUrl/mobile/config'));
        if (res.statusCode == 200) return jsonDecode(res.body);
      } catch (_) {}
    }
    return {};
  }

  // Home Banners
  static Future<List<dynamic>> fetchBanners() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/mobile/banners'));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) {}
    return [];
  }

  // Categories
  static Future<List<dynamic>> fetchCategories() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/mobile/categories'));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) {}
    return [];
  }

  // Send OTP
  static Future<Map<String, dynamic>> sendOtp(String mobileNumber, {String countryCode = '+91'}) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/candidate/send-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'mobileNumber': mobileNumber, 'countryCode': countryCode}),
      );
      return jsonDecode(res.body);
    } catch (e) {
      return {'message': 'Network error sending OTP'};
    }
  }

  // Verify OTP
  static Future<Map<String, dynamic>> verifyOtp(String mobileNumber, String otp, {String countryCode = '+91'}) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/candidate/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'mobileNumber': mobileNumber, 'countryCode': countryCode, 'otp': otp}),
      );
      return jsonDecode(res.body);
    } catch (e) {
      return {'message': 'Network error verifying OTP'};
    }
  }

  // Email Login
  static Future<Map<String, dynamic>> loginEmail(String email, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );
      return jsonDecode(res.body);
    } catch (e) {
      return {'message': 'Network error logging in'};
    }
  }

  // Fetch Jobs Feed
  static Future<List<JobModel>> fetchJobs({String? search, String? city, String? lat, String? lng, String? radius}) async {
    try {
      final queryParams = <String, String>{};
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (city != null && city.isNotEmpty) queryParams['city'] = city;
      if (lat != null && lng != null) {
        queryParams['lat'] = lat;
        queryParams['lng'] = lng;
        if (radius != null) queryParams['radius'] = radius;
      }

      final uri = Uri.parse('$baseUrl/jobs/all').replace(queryParameters: queryParams.isEmpty ? null : queryParams);
      final res = await http.get(uri);
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.map((j) => JobModel.fromJson(j)).toList();
      }
    } catch (e) {}
    return [];
  }

  // Fetch Nearby Geo-Location Jobs
  static Future<List<JobModel>> fetchNearbyJobs(double lat, double lng, {double radius = 25}) async {
    try {
      final uri = Uri.parse('$baseUrl/jobs/nearby?lat=$lat&lng=$lng&radius=$radius');
      final res = await http.get(uri);
      if (res.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(res.body);
        final List jobsList = data['jobs'] ?? [];
        return jobsList.map((j) => JobModel.fromJson(j)).toList();
      }
    } catch (e) {}
    return [];
  }

  // Single Job Details
  static Future<JobModel?> fetchJobDetails(String jobId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/jobs/$jobId'));
      if (res.statusCode == 200) {
        return JobModel.fromJson(jsonDecode(res.body));
      }
    } catch (e) {}
    return null;
  }

  // Recommended Jobs
  static Future<List<JobModel>> fetchRecommendedJobs(String candidateId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/candidate/recommended-jobs/$candidateId'));
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.map((j) => JobModel.fromJson(j)).toList();
      }
    } catch (e) {}
    return [];
  }

  // Save Job
  static Future<bool> saveJob(String jobId, String candidateId) async {
    try {
      final token = await getToken();
      final res = await http.post(
        Uri.parse('$baseUrl/candidate/save-job'),
        headers: _headers(token),
        body: jsonEncode({'jobId': jobId, 'candidateId': candidateId}),
      );
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Saved Jobs List
  static Future<List<JobModel>> fetchSavedJobs(String candidateId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/candidate/saved-jobs/$candidateId'));
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.map((j) => JobModel.fromJson(j)).toList();
      }
    } catch (e) {}
    return [];
  }

  // Apply For Job
  static Future<Map<String, dynamic>> applyForJob({
    required String jobId,
    required String candidateId,
    String? coverLetter,
    String? candidateName,
    String? email,
    String? phone,
  }) async {
    try {
      final token = await getToken();
      final res = await http.post(
        Uri.parse('$baseUrl/applications/apply'),
        headers: _headers(token),
        body: jsonEncode({
          'jobId': jobId,
          'candidateId': candidateId,
          'coverLetter': coverLetter ?? 'I am interested in this position.',
          'applicantName': candidateName ?? 'Jobseeker',
          'applicantEmail': email ?? '',
          'applicantPhone': phone ?? '',
        }),
      );
      return jsonDecode(res.body);
    } catch (e) {
      return {'message': 'Failed to submit job application'};
    }
  }

  // Fetch My Applications
  static Future<List<ApplicationModel>> fetchMyApplications(String candidateId) async {
    try {
      final token = await getToken();
      final res = await http.get(
        Uri.parse('$baseUrl/applications/candidate/$candidateId'),
        headers: _headers(token),
      );
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.map((a) => ApplicationModel.fromJson(a)).toList();
      }
    } catch (e) {}
    return [];
  }

  // Fetch Candidate Profile
  static Future<Map<String, dynamic>?> fetchCandidateProfile(String candidateId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/candidate/profile/$candidateId'));
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {}
    return null;
  }

  // Post Employer Job
  static Future<Map<String, dynamic>> postEmployerJob(Map<String, dynamic> jobData) async {
    try {
      final token = await getToken();
      final res = await http.post(
        Uri.parse('$baseUrl/jobs/post'),
        headers: _headers(token),
        body: jsonEncode(jobData),
      );
      return jsonDecode(res.body);
    } catch (e) {
      return {'message': 'Error posting job'};
    }
  }
}
