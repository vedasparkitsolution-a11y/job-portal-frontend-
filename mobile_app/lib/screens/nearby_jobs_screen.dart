import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/user_model.dart';
import '../models/job_model.dart';
import '../services/api_service.dart';
import 'job_details_screen.dart';

class NearbyJobsScreen extends StatefulWidget {
  final UserModel user;

  const NearbyJobsScreen({super.key, required this.user});

  @override
  State<NearbyJobsScreen> createState() => _NearbyJobsScreenState();
}

class _NearbyJobsScreenState extends State<NearbyJobsScreen> {
  // Demo coordinates (Default: Tech Hub Bangalore)
  double _userLat = 12.9716;
  double _userLng = 77.5946;
  double _radiusKm = 25;
  String _locationName = 'Bangalore, Tech Hub';

  List<JobModel> _nearbyJobs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNearby();
  }

  Future<void> _loadNearby() async {
    setState(() => _isLoading = true);
    final jobs = await ApiService.fetchNearbyJobs(_userLat, _userLng, radius: _radiusKm);
    if (!mounted) return;
    setState(() {
      _nearbyJobs = jobs;
      _isLoading = false;
    });
  }

  void _changeLocation(String city, double lat, double lng) {
    setState(() {
      _locationName = city;
      _userLat = lat;
      _userLng = lng;
    });
    _loadNearby();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.near_me_rounded, color: AppColors.primary),
            const SizedBox(width: 8),
            const Text('Nearby Geo Jobs'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Geo Location Control Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppColors.primary50,
              border: Border(bottom: BorderSide(color: AppColors.primary100, width: 1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.my_location_rounded, color: AppColors.primary, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Your Location:',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    PopupMenuButton<String>(
                      onSelected: (val) {
                        if (val == 'blr') _changeLocation('Bangalore, KA', 12.9716, 77.5946);
                        if (val == 'mum') _changeLocation('Mumbai, MH', 19.0760, 72.8777);
                        if (val == 'del') _changeLocation('Delhi NCR', 28.6139, 77.2090);
                        if (val == 'hyd') _changeLocation('Hyderabad, TS', 17.3850, 78.4867);
                      },
                      itemBuilder: (context) => const [
                        PopupMenuItem(value: 'blr', child: Text('📍 Bangalore')),
                        PopupMenuItem(value: 'mum', child: Text('📍 Mumbai')),
                        PopupMenuItem(value: 'del', child: Text('📍 Delhi NCR')),
                        PopupMenuItem(value: 'hyd', child: Text('📍 Hyderabad')),
                      ],
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.primary200),
                        ),
                        child: Row(
                          children: [
                            Text(_locationName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.primaryDark)),
                            const Icon(Icons.arrow_drop_down, color: AppColors.primary),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Text('Search Radius: ${_radiusKm.toInt()} km', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    Expanded(
                      child: Slider(
                        value: _radiusKm,
                        min: 5,
                        max: 100,
                        divisions: 19,
                        activeColor: AppColors.primary,
                        label: '${_radiusKm.toInt()} km',
                        onChanged: (val) {
                          setState(() => _radiusKm = val);
                        },
                        onChangeEnd: (val) {
                          _loadNearby();
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // List of nearby jobs
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _nearbyJobs.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.location_off_outlined, size: 54, color: AppColors.textMuted),
                            const SizedBox(height: 12),
                            Text('No jobs within ${_radiusKm.toInt()} km', style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 6),
                            const Text('Try increasing your search radius above', style: TextStyle(color: AppColors.textMuted)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _nearbyJobs.length,
                        itemBuilder: (context, index) {
                          final job = _nearbyJobs[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              leading: Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.primary100,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Center(
                                  child: Text(
                                    job.companyName.isNotEmpty ? job.companyName[0].toUpperCase() : 'C',
                                    style: const TextStyle(color: AppColors.primaryDark, fontWeight: FontWeight.w800, fontSize: 18),
                                  ),
                                ),
                              ),
                              title: Text(job.title, style: const TextStyle(fontWeight: FontWeight.w700)),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text('${job.companyName} • ${job.location}', style: const TextStyle(fontSize: 13)),
                                  const SizedBox(height: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary50,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '📍 ${job.distanceKm ?? 5.2} km away',
                                      style: const TextStyle(color: AppColors.primaryDark, fontWeight: FontWeight.w700, fontSize: 11),
                                    ),
                                  ),
                                ],
                              ),
                              trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
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
          ),
        ],
      ),
    );
  }
}
