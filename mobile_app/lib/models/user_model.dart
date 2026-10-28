class UserModel {
  final String id;
  final String email;
  final String role; // 'jobseeker', 'company', 'admin'
  final String? name;
  final String? phone;
  final String? companyName;
  final String? hrName;
  final String? profilePhoto;
  final bool isPremium;
  final int profileCompletionPercentage;

  UserModel({
    required this.id,
    required this.email,
    required this.role,
    this.name,
    this.phone,
    this.companyName,
    this.hrName,
    this.profilePhoto,
    this.isPremium = false,
    this.profileCompletionPercentage = 80,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? json['candidate_id']?.toString() ?? json['employer_id']?.toString() ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'jobseeker',
      name: json['full_name'] ?? json['name'] ?? json['hrName'],
      phone: json['mobile_number'] ?? json['phone'],
      companyName: json['companyName'] ?? json['company_name'],
      hrName: json['hrName'] ?? json['contact_person_name'],
      profilePhoto: json['profile_photo'] ?? json['photo'] ?? json['logoURL'],
      isPremium: json['isPremium'] == 1 || json['isPremium'] == true,
      profileCompletionPercentage: json['profile_completion_percentage'] != null
          ? int.tryParse(json['profile_completion_percentage'].toString()) ?? 80
          : 80,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'role': role,
      'name': name,
      'phone': phone,
      'companyName': companyName,
      'hrName': hrName,
      'profilePhoto': profilePhoto,
      'isPremium': isPremium,
      'profile_completion_percentage': profileCompletionPercentage,
    };
  }
}
