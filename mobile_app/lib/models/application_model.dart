class ApplicationModel {
  final String id;
  final String jobId;
  final String candidateId;
  final String jobTitle;
  final String companyName;
  final String companyLogo;
  final String location;
  final String status; // 'pending', 'reviewed', 'shortlisted', 'rejected', 'hired'
  final String appliedAt;

  ApplicationModel({
    required this.id,
    required this.jobId,
    required this.candidateId,
    required this.jobTitle,
    required this.companyName,
    required this.companyLogo,
    required this.location,
    required this.status,
    required this.appliedAt,
  });

  factory ApplicationModel.fromJson(Map<String, dynamic> json) {
    return ApplicationModel(
      id: json['id']?.toString() ?? '',
      jobId: json['jobId']?.toString() ?? json['job_id']?.toString() ?? '',
      candidateId: json['candidateId']?.toString() ?? json['candidate_id']?.toString() ?? '',
      jobTitle: json['job_title'] ?? json['title'] ?? 'Role Application',
      companyName: json['company_name'] ?? json['companyName'] ?? 'Company',
      companyLogo: json['company_logo'] ?? '',
      location: json['job_location'] ?? json['location'] ?? '',
      status: json['status'] ?? 'pending',
      appliedAt: json['applied_at'] ?? json['createdAt'] ?? 'Recently',
    );
  }
}
