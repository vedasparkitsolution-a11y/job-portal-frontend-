import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/user_model.dart';
import '../models/job_model.dart';
import '../services/api_service.dart';
import 'job_details_screen.dart';

class HomeFeedScreen extends StatefulWidget {
  final UserModel user;

  const HomeFeedScreen({super.key, required this.user});

  @override
  State<HomeFeedScreen> createState() => _HomeFeedScreenState();
}

class _HomeFeedScreenState extends State<HomeFeedScreen> {
  final _searchController = TextEditingController();
  List<JobModel> _jobs = [];
  List<dynamic> _banners = [];
  List<dynamic> _categories = [];
  bool _isLoading = true;
  String _selectedCity = 'All Cities';
  String _selectedCategory = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final banners = await ApiService.fetchBanners();
    final categories = await ApiService.fetchCategories();
    final jobs = await ApiService.fetchJobs(
      search: _searchController.text.trim(),
      city: _selectedCity == 'All Cities' ? null : _selectedCity,
    );

    if (!mounted) return;
    setState(() {
      _banners = banners;
      _categories = categories;
      _jobs = jobs;
      _isLoading = false;
    });
  }

  void _onSearchSubmitted(String query) {
    _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          color: AppColors.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header section
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    border: Border(bottom: BorderSide(color: AppColors.border, width: 1)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Hello, ${widget.user.name ?? "Jobseeker"} 👋',
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Discover your next dream role',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ),
                          Container(
                            decoration: BoxDecoration(
                              color: AppColors.primary50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.notifications_none_rounded, color: AppColors.primary),
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('No new notifications')),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Search bar
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.inputBg,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border, width: 1.5),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onSubmitted: _onSearchSubmitted,
                          decoration: InputDecoration(
                            hintText: 'Search jobs, skills, or companies...',
                            prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                            suffixIcon: IconButton(
                              icon: const Icon(Icons.tune_rounded, color: AppColors.textSecondary),
                              onPressed: _showFilterModal,
                            ),
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Banners Carousel
                if (_banners.isNotEmpty) ...[
                  SizedBox(
                    height: 140,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _banners.length,
                      itemBuilder: (context, index) {
                        final b = _banners[index];
                        return Container(
                          width: 280,
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF0EA5E9), Color(0xFF0284C7)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: const [
                              BoxShadow(color: AppColors.primaryGlow, blurRadius: 10, offset: Offset(0, 4)),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    b['title'] ?? '',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    b['subtitle'] ?? '',
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.9),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              Align(
                                alignment: Alignment.bottomRight,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    b['actionText'] ?? 'Explore',
                                    style: const TextStyle(
                                      color: AppColors.primaryDark,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                // Categories
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    'Explore Categories',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 42,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _categories.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        final isSelected = _selectedCategory.isEmpty;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: const Text('All Roles'),
                            selected: isSelected,
                            onSelected: (_) {
                              setState(() => _selectedCategory = '');
                              _loadData();
                            },
                            selectedColor: AppColors.primary100,
                            checkmarkColor: AppColors.primary,
                            labelStyle: TextStyle(
                              color: isSelected ? AppColors.primary : AppColors.textSecondary,
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            ),
                          ),
                        );
                      }
                      final cat = _categories[index - 1];
                      final isSelected = _selectedCategory == cat['name'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(cat['name'] ?? ''),
                          selected: isSelected,
                          onSelected: (_) {
                            setState(() => _selectedCategory = cat['name'] ?? '');
                            _loadData();
                          },
                          selectedColor: AppColors.primary100,
                          checkmarkColor: AppColors.primary,
                          labelStyle: TextStyle(
                            color: isSelected ? AppColors.primary : AppColors.textSecondary,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 24),

                // Jobs List Title
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Featured Jobs (${_jobs.length})',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      TextButton(
                        onPressed: _loadData,
                        child: const Text('Refresh', style: TextStyle(color: AppColors.primary)),
                      ),
                    ],
                  ),
                ),

                // Jobs Cards Feed
                if (_isLoading)
                  const Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                  )
                else if (_jobs.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(40),
                    child: Center(
                      child: Column(
                        children: [
                          const Icon(Icons.work_off_outlined, size: 48, color: AppColors.textMuted),
                          const SizedBox(height: 12),
                          Text('No jobs matching your query', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 4),
                          const Text('Try adjusting your search keywords or city filter', style: TextStyle(color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                  )
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _jobs.length,
                    itemBuilder: (context, index) {
                      final job = _jobs[index];
                      return _buildJobCard(job);
                    },
                  ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildJobCard(JobModel job) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => JobDetailsScreen(job: job, user: widget.user),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Company Icon/Logo
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primary50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        job.companyName.isNotEmpty ? job.companyName[0].toUpperCase() : 'C',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                          fontSize: 20,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          job.title,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          job.companyName,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.bookmark_border_rounded, color: AppColors.textMuted),
                    onPressed: () async {
                      final ok = await ApiService.saveJob(job.id, widget.user.id);
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(ok ? 'Job saved to bookmarks!' : 'Failed to save job'),
                          backgroundColor: ok ? AppColors.success : AppColors.danger,
                        ),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Badges row
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  _buildBadge(Icons.location_on_outlined, job.location),
                  _buildBadge(Icons.work_outline, job.jobType),
                  _buildBadge(Icons.payments_outlined, job.salary),
                  if (job.distanceKm != null)
                    _buildBadge(Icons.near_me_outlined, '${job.distanceKm} km away', color: AppColors.accent),
                ],
              ),
              const SizedBox(height: 14),

              const Divider(height: 1, color: AppColors.border),
              const SizedBox(height: 10),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.bolt_rounded, size: 16, color: AppColors.warning),
                      const SizedBox(width: 4),
                      Text(
                        '${job.matchScore}% Match',
                        style: const TextStyle(
                          color: AppColors.primaryDark,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'Apply Now →',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBadge(IconData icon, String label, {Color color = AppColors.textSecondary}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  void _showFilterModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Filter Jobs by Location', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: ['All Cities', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Noida']
                    .map((city) => ChoiceChip(
                          label: Text(city),
                          selected: _selectedCity == city,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => _selectedCity = city);
                              Navigator.pop(context);
                              _loadData();
                            }
                          },
                        ))
                    .toList(),
              ),
            ],
          ),
        );
      },
    );
  }
}
