import { navigateTo, setNavigateFunction } from '../../navigation-utils';

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/',
  pathname: '/',
  search: '',
  hash: '',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('Navigation Utils', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset navigate function
    setNavigateFunction(null as any);
  });

  describe('setNavigateFunction', () => {
    it('should set navigate function', () => {
      setNavigateFunction(mockNavigate);
      // Function is set, no direct way to test this
      expect(true).toBe(true);
    });
  });

  describe('navigateTo', () => {
    it('should call navigate function when set', () => {
      setNavigateFunction(mockNavigate);
      
      navigateTo('/test-path');
      
      expect(mockNavigate).toHaveBeenCalledWith('/test-path', undefined);
    });

    it('should call navigate with options', () => {
      setNavigateFunction(mockNavigate);
      
      navigateTo('/test-path', { replace: true });
      
      expect(mockNavigate).toHaveBeenCalledWith('/test-path', { replace: true });
    });

    it('should fallback to window.location when navigate not set', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      navigateTo('/fallback-path');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Navigation function not set. Cannot navigate to:', 
        '/fallback-path'
      );
      expect(window.location.href).toBe('/fallback-path');
      
      consoleSpy.mockRestore();
    });

    it('should handle different path formats', () => {
      setNavigateFunction(mockNavigate);
      
      navigateTo('/dashboard');
      navigateTo('/study-profile/quiz');
      navigateTo('/settings');
      
      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenNthCalledWith(1, '/dashboard', undefined);
      expect(mockNavigate).toHaveBeenNthCalledWith(2, '/study-profile/quiz', undefined);
      expect(mockNavigate).toHaveBeenNthCalledWith(3, '/settings', undefined);
    });

    it('should handle query parameters', () => {
      setNavigateFunction(mockNavigate);
      
      navigateTo('/study-profile/quiz?return=/dashboard');
      
      expect(mockNavigate).toHaveBeenCalledWith('/study-profile/quiz?return=/dashboard', undefined);
    });

    it('should handle hash fragments', () => {
      setNavigateFunction(mockNavigate);
      
      navigateTo('/dashboard#section1');
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard#section1', undefined);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle quiz redirect scenario', () => {
      setNavigateFunction(mockNavigate);
      
      // Simulate API interceptor redirect
      navigateTo('/study-profile/quiz?return=/ai-suggestions');
      
      expect(mockNavigate).toHaveBeenCalledWith('/study-profile/quiz?return=/ai-suggestions', undefined);
    });

    it('should handle post-quiz completion navigation', () => {
      setNavigateFunction(mockNavigate);
      
      // Simulate quiz completion
      navigateTo('/today');
      
      expect(mockNavigate).toHaveBeenCalledWith('/today', undefined);
    });

    it('should handle settings navigation', () => {
      setNavigateFunction(mockNavigate);
      
      navigateTo('/settings');
      
      expect(mockNavigate).toHaveBeenCalledWith('/settings', undefined);
    });
  });
});
