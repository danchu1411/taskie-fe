# 🎨 Transition Effects Guide

Hướng dẫn sử dụng các transition effects đã được implement trong ứng dụng Taskie.

## ✨ **Các Transition Effects Available**

### 1. **Dropdown Transition**
```tsx
// Dropdown với smooth transition
<div className={`absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50 ${
  isOpen 
    ? 'animate-dropdown-in opacity-100 scale-100 translate-y-0 pointer-events-auto' 
    : 'animate-dropdown-out opacity-0 scale-95 -translate-y-2 pointer-events-none'
}`}>
  {/* Dropdown content */}
</div>
```

**Hiệu ứng:**
- Fade in/out với opacity
- Scale từ 95% đến 100%
- Slide từ trên xuống
- Smooth duration: 200ms

### 2. **Fade In Animation**
```tsx
// Fade in với delay
<div 
  className="p-4 bg-blue-50 rounded-lg animate-fade-in"
  style={{ animationDelay: '0.1s' }}
>
  Content fades in with delay
</div>
```

**Hiệu ứng:**
- Fade từ opacity 0 đến 1
- Slide từ dưới lên 5px
- Duration: 300ms
- Support animation delay

### 3. **Scale Animation**
```tsx
// Hover scale effect
<div className="p-4 bg-slate-100 rounded-lg hover:scale-105 transition-transform duration-200 cursor-pointer">
  Hover to scale
</div>
```

**Hiệu ứng:**
- Scale on hover
- Smooth transition
- Customizable scale values

### 4. **Slide Up Animation**
```tsx
// Slide up effect
<div className="p-4 bg-slate-100 rounded-lg animate-slide-up">
  This element slides up when it appears
</div>
```

**Hiệu ứng:**
- Slide từ dưới lên
- Fade in cùng lúc
- Duration: 300ms

## 🎯 **Usage Examples**

### **User Dropdown (NavigationBar)**
```tsx
// Button với scale effect khi active
<button
  className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium transition-all duration-200 ${
    userDropdownOpen 
      ? 'bg-indigo-700 scale-105 shadow-lg' 
      : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
  }`}
>
  {user?.name?.charAt(0)?.toUpperCase()}
</button>

// Dropdown với smooth transition
<div className={`absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50 ${
  userDropdownOpen 
    ? 'animate-dropdown-in opacity-100 scale-100 translate-y-0 pointer-events-auto' 
    : 'animate-dropdown-out opacity-0 scale-95 -translate-y-2 pointer-events-none'
}`}>
  {/* Menu items với cascade animation */}
  <button className={`w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-all duration-200 ${
    userDropdownOpen ? 'animate-fade-in' : ''
  }`} style={{ animationDelay: userDropdownOpen ? '0.1s' : '0s' }}>
    Profile
  </button>
</div>
```

### **Cascade Animation**
```tsx
// Multiple items với staggered animation
{items.map((item, index) => (
  <div 
    key={item.id}
    className={`p-4 rounded-lg animate-fade-in ${
      isVisible ? 'animate-fade-in' : ''
    }`}
    style={{ animationDelay: isVisible ? `${index * 0.1}s` : '0s' }}
  >
    {item.content}
  </div>
))}
```

## ⚙️ **Configuration**

### **Tailwind Config**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'dropdown-in': 'dropdownIn 0.2s ease-out',
        'dropdown-out': 'dropdownOut 0.15s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        dropdownIn: {
          '0%': { 
            opacity: '0', 
            transform: 'scale(0.95) translateY(-10px)',
            visibility: 'hidden'
          },
          '100%': { 
            opacity: '1', 
            transform: 'scale(1) translateY(0)',
            visibility: 'visible'
          },
        },
        dropdownOut: {
          '0%': { 
            opacity: '1', 
            transform: 'scale(1) translateY(0)',
            visibility: 'visible'
          },
          '100%': { 
            opacity: '0', 
            transform: 'scale(0.95) translateY(-10px)',
            visibility: 'hidden'
          },
        },
      },
    },
  },
}
```

## 🎨 **Best Practices**

### **1. Performance**
- Sử dụng `transform` và `opacity` cho smooth animation
- Tránh animate `width`, `height`, `margin`, `padding`
- Sử dụng `will-change` cho complex animations

### **2. Accessibility**
- Respect `prefers-reduced-motion` setting
- Đảm bảo animation không gây chóng mặt
- Giữ duration ngắn (< 300ms)

### **3. UX Guidelines**
- **Dropdown**: 200ms duration
- **Hover effects**: 150-200ms
- **Page transitions**: 300ms
- **Loading states**: 500ms+

### **4. Timing Functions**
- `ease-out`: Cho elements xuất hiện
- `ease-in`: Cho elements biến mất
- `ease-in-out`: Cho toggle states
- `linear`: Cho continuous animations

## 🔧 **Custom Animations**

### **Tạo Custom Animation**
```tsx
// 1. Thêm vào tailwind.config.js
animation: {
  'custom-bounce': 'customBounce 0.6s ease-in-out',
},
keyframes: {
  customBounce: {
    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
    '40%': { transform: 'translateY(-10px)' },
    '60%': { transform: 'translateY(-5px)' },
  },
}

// 2. Sử dụng trong component
<div className="animate-custom-bounce">
  Bouncing content
</div>
```

### **Conditional Animation**
```tsx
const [isVisible, setIsVisible] = useState(false);

<div className={`transition-all duration-300 ${
  isVisible 
    ? 'opacity-100 translate-y-0' 
    : 'opacity-0 translate-y-4'
}`}>
  Content with conditional animation
</div>
```

## 📱 **Mobile Considerations**

- Giảm animation duration trên mobile
- Sử dụng `transform` thay vì layout properties
- Test trên các device khác nhau
- Consider battery impact

## 🐛 **Troubleshooting**

### **Animation không smooth**
- Check `will-change` property
- Đảm bảo không có conflicting CSS
- Sử dụng `transform` thay vì layout properties

### **Animation delay không hoạt động**
- Check `animationDelay` syntax
- Đảm bảo element có `animate-*` class
- Verify Tailwind config

### **Performance issues**
- Reduce animation complexity
- Use `transform` và `opacity` only
- Consider `prefers-reduced-motion`

## 🎉 **Demo Component**

Xem `src/components/demo/TransitionDemo.tsx` để test tất cả các transition effects.

```tsx
import TransitionDemo from './components/demo/TransitionDemo';

// Sử dụng trong app
<TransitionDemo />
```

---

**Lưu ý**: Tất cả animations đã được optimize cho performance và accessibility. Sử dụng một cách có trách nhiệm để tạo trải nghiệm người dùng tốt nhất!
