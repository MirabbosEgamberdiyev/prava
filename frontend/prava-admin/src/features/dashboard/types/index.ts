export interface PopularPackageItem {
  packageId: number;
  packageName: string;
  examCount: number;
  averageScore: number;
}

export interface PopularTicketItem {
  ticketId: number;
  ticketNumber: number;
  ticketName: string;
  examCount: number;
  averageScore: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalQuestions: number;
  totalPackages: number;
  totalTickets: number;
  totalExams: number;
  completedExams: number;
  activeExams: number;
  averageScore: number;
  examsToday: number;
  examsThisWeek: number;
  examsThisMonth: number;
  activeUsersToday: number;
  packageExams: number;
  ticketExams: number;
  marathonExams: number;
  passedExams: number;
  failedExams: number;
  passRate: number;
  popularPackages: PopularPackageItem[];
  popularTickets: PopularTicketItem[];
}

export interface TopicStats {
  topic: string;
  totalQuestions: number;
  totalExams: number;
  averageScore: number;
  passedExams: number;
}

export interface RecentExam {
  sessionId: number;
  userName: string;
  packageName: string;
  ticketNumber: number | null;
  topicName: string;
  score: number;
  percentage: number;
  isPassed: boolean;
  status: string;
  startedAt: string;
  finishedAt: string;
  totalQuestions: number;
  correctCount: number;
}
