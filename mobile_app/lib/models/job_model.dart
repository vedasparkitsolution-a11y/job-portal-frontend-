class JobModel {
  final String id;
  final String jobId;
  final String title;
  final String companyName;
  final String companyLogo;
  final String location;
  final String locationType; // On-site, Remote, Hybrid
  final String jobType; // Full Time, Part Time, Contract, Internship
  final String salary;
  final String experience;
  final String description;
  final String requiredSkills;
  final String postedAt;
  final double? latitude;
  final double? longitude;
  final double? distanceKm;
  final int matchScore;
  final String status;
  final String city;

  JobModel({
    required this.id,
    required this.jobId,
    required this.title,
    required this.companyName,
    required this.companyLogo,
    required this.location,
    required this.locationType,
    required this.jobType,
    required this.salary,
    required this.experience,
    required this.description,
    required this.requiredSkills,
    required this.postedAt,
    this.latitude,
    this.longitude,
    this.distanceKm,
    this.matchScore = 85,
    this.status = 'active',
    this.city = '',
  });

  factory JobModel.fromJson(Map<String, dynamic> json) {
    return JobModel(
      id: json['id']?.toString() ?? json['job_id']?.toString() ?? '',
      jobId: json['job_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['job_title'] ?? json['title'] ?? 'Untitled Position',
      companyName: json['company_name'] ?? json['companyName'] ?? 'Tech Enterprise',
      companyLogo: json['company_logo'] ?? json['logoURL'] ?? '',
      location: json['job_location'] ?? json['location'] ?? 'Remote',
      locationType: json['location_type'] ?? 'On-site',
      jobType: json['job_type'] ?? json['jobType'] ?? 'Full Time',
      salary: json['salary'] ?? (json['minimum_salary'] != null ? '₹${json['minimum_salary']} - ₹${json['maximum_salary']}' : 'Competitive'),
      experience: json['experience'] ?? json['minimum_experience'] ?? 'Any Experience',
      description: json['job_description'] ?? json['description'] ?? 'No description provided.',
      requiredSkills: json['required_skills'] ?? json['skills'] ?? '',
      postedAt: json['posted_at'] ?? json['createdAt'] ?? 'Recently',
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
      distanceKm: json['distance_km'] != null ? double.tryParse(json['distance_km'].toString()) : null,
      matchScore: json['matchScore'] != null ? int.tryParse(json['matchScore'].toString()) ?? 85 : 85,
      status: json['status'] ?? 'active',
      city: json['city'] ?? '',
    );
  }
}
