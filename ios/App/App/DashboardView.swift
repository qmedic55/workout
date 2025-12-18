import SwiftUI

struct DashboardView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @State private var todayLog: DailyLog?
    @State private var insights: [HealthInsight] = []
    @State private var isLoading = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Greeting
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(Date().timeBasedGreeting)
                                .font(.title2)
                                .fontWeight(.semibold)
                            if let name = authViewModel.userProfile?.firstName {
                                Text(name)
                                    .font(.title)
                                    .fontWeight(.bold)
                            }
                        }
                        Spacer()
                    }
                    .padding(.horizontal)
                    .padding(.top)
                    
                    // Metric Cards
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        MetricCard(
                            title: "Weight",
                            value: todayLog?.weightKg?.formatted(decimalPlaces: 1) ?? "--",
                            unit: "kg",
                            icon: "scalemass.fill",
                            color: .blue
                        )
                        
                        MetricCard(
                            title: "Calories",
                            value: todayLog?.caloriesConsumed?.formatted ?? "--",
                            unit: "kcal",
                            icon: "flame.fill",
                            color: .orange,
                            target: authViewModel.userProfile?.targetCalories
                        )
                        
                        MetricCard(
                            title: "Steps",
                            value: todayLog?.steps?.formatted ?? "--",
                            unit: "steps",
                            icon: "figure.walk",
                            color: .green,
                            target: authViewModel.userProfile?.dailyStepsTarget
                        )
                        
                        MetricCard(
                            title: "Sleep",
                            value: todayLog?.sleepHours?.formatted(decimalPlaces: 1) ?? "--",
                            unit: "hrs",
                            icon: "moon.stars.fill",
                            color: .purple
                        )
                    }
                    .padding(.horizontal)
                    
                    // Current Phase
                    if let phase = authViewModel.userProfile?.currentPhase {
                        PhaseCard(phase: phase)
                            .padding(.horizontal)
                    }
                    
                    // Quick Actions
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Quick Actions")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 12) {
                            QuickActionCard(
                                title: "Log Today",
                                icon: "square.and.pencil",
                                color: .blue
                            )
                            
                            QuickActionCard(
                                title: "AI Coach",
                                icon: "message.fill",
                                color: .purple
                            )
                            
                            QuickActionCard(
                                title: "Add Food",
                                icon: "fork.knife",
                                color: .orange
                            )
                            
                            QuickActionCard(
                                title: "View Progress",
                                icon: "chart.line.uptrend.xyaxis",
                                color: .green
                            )
                        }
                        .padding(.horizontal)
                    }
                    
                    // Macro Targets
                    if let profile = authViewModel.userProfile,
                       let protein = profile.proteinGrams,
                       let carbs = profile.carbsGrams,
                       let fat = profile.fatGrams {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Today's Macros")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            VStack(spacing: 16) {
                                MacroProgressBar(
                                    name: "Protein",
                                    current: Int(todayLog?.proteinGrams ?? 0),
                                    target: protein,
                                    color: .blue
                                )
                                
                                MacroProgressBar(
                                    name: "Carbs",
                                    current: Int(todayLog?.carbsGrams ?? 0),
                                    target: carbs,
                                    color: .orange
                                )
                                
                                MacroProgressBar(
                                    name: "Fat",
                                    current: Int(todayLog?.fatGrams ?? 0),
                                    target: fat,
                                    color: .purple
                                )
                            }
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color(.secondarySystemBackground))
                            )
                            .padding(.horizontal)
                        }
                    }
                    
                    // Health Insights
                    if !insights.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Health Insights")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ForEach(insights.prefix(3)) { insight in
                                InsightCard(insight: insight)
                                    .padding(.horizontal)
                            }
                        }
                    }
                }
                .padding(.bottom, 32)
            }
            .navigationTitle("Home")
            .task {
                await loadData()
            }
            .refreshable {
                await loadData()
            }
        }
    }
    
    private func loadData() async {
        isLoading = true
        
        async let logTask = try? await APIClient.shared.getTodayLog()
        async let insightsTask = try? await APIClient.shared.getInsights()
        
        todayLog = await logTask
        insights = (await insightsTask ?? []).sorted { $0.priority > $1.priority }
        
        isLoading = false
    }
}

// MARK: - Metric Card

struct MetricCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let color: Color
    var target: Int? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Spacer()
            }
            
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
            
            HStack {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                if let target = target {
                    Text("/\(target)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            
            if let target = target, let numValue = Int(value.replacingOccurrences(of: ",", with: "")) {
                ProgressView(value: Double(numValue), total: Double(target))
                    .tint(color)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.secondarySystemBackground))
        )
    }
}

// MARK: - Phase Card

struct PhaseCard: View {
    let phase: String
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 8) {
                Text("Current Phase")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Text(phase.phaseDisplayName)
                    .font(.headline)
                    .foregroundStyle(.primary)
            }
            
            Spacer()
            
            Image(systemName: "arrow.right.circle.fill")
                .foregroundStyle(phase.phaseColor)
                .font(.title2)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(phase.phaseColor.opacity(0.1))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(phase.phaseColor, lineWidth: 1)
        )
    }
}

// MARK: - Quick Action Card

struct QuickActionCard: View {
    let title: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.secondarySystemBackground))
        )
    }
}

// MARK: - Macro Progress Bar

struct MacroProgressBar: View {
    let name: String
    let current: Int
    let target: Int
    let color: Color
    
    var progress: Double {
        guard target > 0 else { return 0 }
        return min(Double(current) / Double(target), 1.0)
    }
    
    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Text(name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                Text("\(current)g / \(target)g")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.tertiarySystemBackground))
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geometry.size.width * progress)
                }
            }
            .frame(height: 8)
        }
    }
}

// MARK: - Insight Card

struct InsightCard: View {
    let insight: HealthInsight
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: insight.icon)
                .font(.title3)
                .foregroundStyle(insight.color)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(insight.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Text(insight.message)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(insight.color.opacity(0.1))
        )
    }
}

#Preview {
    DashboardView()
        .environment(AuthViewModel())
}
