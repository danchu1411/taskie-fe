// Setup i18n structure early to avoid refactoring later
export const QUIZ_COPY = {
  vi: {
    welcome: {
      title: "Khám phá phong cách học tập của bạn",
      description: "Trả lời 6-9 câu hỏi ngắn để AI hiểu bạn hơn và đưa ra gợi ý phù hợp nhất",
      estimatedTime: "⏱️ Chỉ mất 2-3 phút"
    },
    questions: {
      chrono_1: "Khi nào bạn cảm thấy năng suất nhất?",
      chrono_2: "Lịch ngủ lý tưởng của bạn?",
      focus_1: "Bạn làm việc hiệu quả nhất khi?",
      focus_2: "Khi có deadline gấp, bạn thường?",
      focus_3: "Môi trường làm việc lý tưởng của bạn?",
      work_1: "Động lực làm việc chính của bạn?",
      work_2: "Bạn thích làm việc theo cách nào?"
    },
    options: {
      chrono_morning: "Buổi sáng (6h-12h)",
      chrono_evening: "Buổi tối (18h-24h)",
      chrono_flexible: "Linh hoạt theo ngày",
      chrono_early_bed: "Ngủ sớm, dậy sớm",
      chrono_late_bed: "Ngủ kê, dậy muộn",
      chrono_variable: "Thay đổi theo tuần",
      focus_deep: "Tập trung sâu 2-3 giờ liên tục",
      focus_sprint: "Làm theo khoảng 25-45 phút, nghỉ ngắn",
      focus_multitask: "Xử lý nhiều việc song song",
      focus_plan_ahead: "Lên kế hoạch chi tiết từ trước",
      focus_improvise: "Ứng biến và điều chỉnh linh hoạt",
      focus_quiet_space: "Không gian yên tĩnh, ít tiếng ồn",
      focus_collaborative: "Làm việc nhóm, trao đổi ý tưởng",
      focus_anywhere: "Bất kỳ đâu, miễn có internet",
      work_deadline: "Deadline sắp đến",
      work_steady: "Tiến độ đều đặn mỗi ngày",
      work_structured: "Theo lịch trình có sẵn",
      work_spontaneous: "Làm khi cảm hứng"
    },
    success: {
      title: "Hoàn thành! 🎉",
      message: "Profile của bạn đã được lưu. AI sẽ sử dụng thông tin này để đề xuất tasks và lịch học phù hợp.",
      cta: "Dùng thử AI Suggestions"
    },
    navigation: {
      next: "Tiếp theo",
      back: "Quay lại",
      submit: "Hoàn thành",
      skip: "Bỏ qua"
    },
    validation: {
      required: "Vui lòng chọn một đáp án",
      incomplete: "Bạn chưa hoàn thành tất cả câu hỏi"
    }
  },
  en: {
    welcome: {
      title: "Discover Your Learning Style",
      description: "Answer 6-9 short questions to help AI understand you better and provide personalized suggestions",
      estimatedTime: "⏱️ Takes only 2-3 minutes"
    },
    questions: {
      chrono_1: "When do you feel most productive?",
      chrono_2: "What's your ideal sleep schedule?",
      focus_1: "You work most effectively when?",
      focus_2: "When facing tight deadlines, you usually?",
      focus_3: "Your ideal work environment is?",
      work_1: "Your main work motivation is?",
      work_2: "How do you prefer to work?"
    },
    options: {
      chrono_morning: "Morning (6am-12pm)",
      chrono_evening: "Evening (6pm-12am)",
      chrono_flexible: "Flexible throughout the day",
      chrono_early_bed: "Early to bed, early to rise",
      chrono_late_bed: "Late to bed, late to rise",
      chrono_variable: "Changes weekly",
      focus_deep: "Deep focus for 2-3 hours straight",
      focus_sprint: "25-45 minute sprints with short breaks",
      focus_multitask: "Handling multiple tasks simultaneously",
      focus_plan_ahead: "Detailed planning in advance",
      focus_improvise: "Improvise and adapt flexibly",
      focus_quiet_space: "Quiet space with minimal noise",
      focus_collaborative: "Team work with idea exchange",
      focus_anywhere: "Anywhere with internet access",
      work_deadline: "Approaching deadlines",
      work_steady: "Steady daily progress",
      work_structured: "Following a set schedule",
      work_spontaneous: "Working when inspired"
    },
    success: {
      title: "Complete! 🎉",
      message: "Your profile has been saved. AI will use this information to suggest tasks and study schedules that fit you.",
      cta: "Try AI Suggestions"
    },
    navigation: {
      next: "Next",
      back: "Back",
      submit: "Complete",
      skip: "Skip"
    },
    validation: {
      required: "Please select an answer",
      incomplete: "You haven't completed all questions"
    }
  }
};

// Helper function to get localized copy
export function getQuizCopy(locale: 'vi' | 'en' = 'vi') {
  return QUIZ_COPY[locale];
}

// Helper to get localized text by key
export function getLocalizedText(key: string, locale: 'vi' | 'en' = 'vi'): string {
  const copy = getQuizCopy(locale);
  const keys = key.split('.');
  let value: any = copy;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}
