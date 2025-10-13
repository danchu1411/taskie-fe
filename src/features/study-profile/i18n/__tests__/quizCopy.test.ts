import { getLocalizedText } from '../quizCopy';

describe('Quiz Copy i18n', () => {
  describe('getLocalizedText', () => {
    it('should return Vietnamese text for vi locale', () => {
      const title = getLocalizedText('vi', 'welcome.title');
      expect(title).toBe('Khám phá phong cách học tập của bạn');
    });

    it('should return English text for en locale', () => {
      const title = getLocalizedText('en', 'welcome.title');
      expect(title).toBe('Discover Your Learning Style');
    });

    it('should return nested text correctly', () => {
      const question = getLocalizedText('vi', 'questions.chronotype_1.question');
      expect(question).toBe('Bạn cảm thấy năng suất nhất vào thời điểm nào trong ngày?');
    });

    it('should return fallback when key not found', () => {
      const fallback = getLocalizedText('vi', 'nonexistent.key', 'Default Text');
      expect(fallback).toBe('Default Text');
    });

    it('should return key when no fallback provided', () => {
      const key = getLocalizedText('vi', 'nonexistent.key');
      expect(key).toBe('nonexistent.key');
    });

    it('should handle invalid locale gracefully', () => {
      const text = getLocalizedText('fr' as any, 'welcome.title', 'Fallback');
      expect(text).toBe('Fallback');
    });

    it('should return all chronotype questions', () => {
      const chrono1 = getLocalizedText('vi', 'questions.chronotype_1.question');
      const chrono2 = getLocalizedText('vi', 'questions.chronotype_2.question');
      
      expect(chrono1).toContain('năng suất');
      expect(chrono2).toContain('bắt đầu');
    });

    it('should return all focusStyle questions', () => {
      const focus1 = getLocalizedText('vi', 'questions.focusStyle_1.question');
      const focus2 = getLocalizedText('vi', 'questions.focusStyle_2.question');
      
      expect(focus1).toContain('hiệu quả');
      expect(focus2).toContain('tiếp cận');
    });

    it('should return all workStyle questions', () => {
      const work1 = getLocalizedText('vi', 'questions.workStyle_1.question');
      const work2 = getLocalizedText('vi', 'questions.workStyle_2.question');
      
      expect(work1).toContain('thúc đẩy');
      expect(work2).toContain('làm việc');
    });

    it('should return navigation text', () => {
      const back = getLocalizedText('vi', 'navigation.back');
      const next = getLocalizedText('vi', 'navigation.next');
      const submit = getLocalizedText('vi', 'navigation.submit');
      
      expect(back).toBe('Quay lại');
      expect(next).toBe('Tiếp theo');
      expect(submit).toBe('Hoàn thành');
    });

    it('should return completion text', () => {
      const title = getLocalizedText('vi', 'complete.title');
      const description = getLocalizedText('vi', 'complete.description');
      const button = getLocalizedText('vi', 'complete.button');
      
      expect(title).toBe('Hoàn thành hồ sơ học tập!');
      expect(description).toContain('Cảm ơn bạn');
      expect(button).toBe('Bắt đầu sử dụng Taskie');
    });

    it('should return error and validation text', () => {
      const error = getLocalizedText('vi', 'error');
      const validation = getLocalizedText('vi', 'validation');
      
      expect(error).toBe('Đã có lỗi xảy ra. Vui lòng thử lại.');
      expect(validation).toBe('Vui lòng chọn một câu trả lời.');
    });

    it('should handle English translations correctly', () => {
      const welcomeTitle = getLocalizedText('en', 'welcome.title');
      const welcomeDesc = getLocalizedText('en', 'welcome.description');
      const estimatedTime = getLocalizedText('en', 'welcome.estimatedTime');
      
      expect(welcomeTitle).toBe('Discover Your Learning Style');
      expect(welcomeDesc).toContain('Answer 6-9 short questions');
      expect(estimatedTime).toBe('⏱️ Takes only 2-3 minutes');
    });

    it('should return option labels correctly', () => {
      const morningWarrior = getLocalizedText('vi', 'questions.chronotype_1.options.0.label');
      const nightOwl = getLocalizedText('vi', 'questions.chronotype_1.options.1.label');
      const flexible = getLocalizedText('vi', 'questions.chronotype_1.options.2.label');
      
      expect(morningWarrior).toBe('Sáng sớm (Morning Warrior)');
      expect(nightOwl).toBe('Tối muộn (Night Owl)');
      expect(flexible).toBe('Linh hoạt (Flexible)');
    });
  });
});
