# 🚀 Performance Optimizations

Tài liệu này mô tả các tối ưu hóa hiệu suất đã được triển khai trong ứng dụng Taskie.

## 📊 Các tối ưu hóa đã triển khai

### 1. **Bundle Optimization**
- **Code Splitting**: Tách code thành các chunks nhỏ hơn
- **Tree Shaking**: Loại bỏ code không sử dụng
- **Minification**: Nén code với Terser
- **Manual Chunks**: Tách vendor libraries riêng biệt

### 2. **React Performance**
- **React.memo**: Memoize components để tránh re-renders không cần thiết
- **useCallback**: Memoize callbacks
- **useMemo**: Memoize expensive calculations
- **Lazy Loading**: Load components khi cần thiết

### 3. **Data Fetching Optimization**
- **Cache Configuration**: Tăng stale time và GC time
- **Prefetching**: Prefetch data cho navigation
- **Background Refetch**: Cập nhật data trong background
- **Batch Operations**: Gộp multiple API calls

### 4. **Component Structure**
- **Component Splitting**: Tách component lớn thành nhỏ hơn
- **Props Optimization**: Giảm props drilling
- **State Management**: Tối ưu state updates

## 🛠️ Cách sử dụng

### Build với analysis
```bash
npm run build:analyze
```

### Analyze bundle size
```bash
npm run perf:analyze
```

### Monitor performance trong development
```bash
npm run perf:monitor
```

## 📈 Performance Metrics

### Bundle Size Targets
- **JavaScript**: < 500KB
- **CSS**: < 100KB
- **Total**: < 1MB

### Runtime Performance
- **First Paint**: < 1.5s
- **First Contentful Paint**: < 2s
- **Time to Interactive**: < 3s

## 🔧 Cấu hình

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          // ...
        },
      },
    },
  },
});
```

### Cache Configuration
```typescript
// src/features/schedule/constants/cacheConfig.ts
export const CACHE_CONFIG = {
  STALE_TIME: 10 * 60 * 1000, // 10 minutes
  GC_TIME: 30 * 60 * 1000, // 30 minutes
  REFETCH_INTERVAL: 5 * 60 * 1000, // 5 minutes
};
```

## 📝 Best Practices

### 1. Component Optimization
```typescript
// ✅ Good: Memoized component
const MyComponent = memo(function MyComponent({ data }) {
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);

  return <div>{processedData}</div>;
});

// ❌ Bad: Component re-renders on every parent update
function MyComponent({ data }) {
  const processedData = expensiveCalculation(data);
  return <div>{processedData}</div>;
}
```

### 2. Callback Optimization
```typescript
// ✅ Good: Memoized callback
const handleClick = useCallback(() => {
  doSomething();
}, []);

// ❌ Bad: New function on every render
const handleClick = () => {
  doSomething();
};
```

### 3. Data Fetching
```typescript
// ✅ Good: Optimized query
const { data } = useQuery({
  queryKey: ['tasks', userId],
  queryFn: fetchTasks,
  staleTime: CACHE_CONFIG.STALE_TIME,
  gcTime: CACHE_CONFIG.GC_TIME,
});

// ❌ Bad: No caching
const { data } = useQuery({
  queryKey: ['tasks', userId],
  queryFn: fetchTasks,
});
```

## 🔍 Monitoring

### Development Tools
- **React DevTools Profiler**: Analyze component renders
- **Chrome DevTools Performance**: Monitor runtime performance
- **Bundle Analyzer**: Analyze bundle size

### Production Monitoring
- **Performance Observer API**: Track real user metrics
- **Error Tracking**: Monitor performance issues
- **Analytics**: Track user experience metrics

## 🚨 Performance Warnings

Ứng dụng sẽ hiển thị warnings trong console khi:
- Component render time > 16ms (60fps threshold)
- API call duration > 1 second
- Memory usage > 80% of limit
- Bundle size > recommended limits

## 📚 Tài liệu tham khảo

- [React Performance](https://react.dev/learn/render-and-commit)
- [Vite Optimization](https://vitejs.dev/guide/build.html)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Analysis](https://webpack.js.org/guides/code-splitting/)

## 🤝 Contributing

Khi thêm tính năng mới, hãy:
1. Sử dụng React.memo cho components
2. Memoize callbacks và expensive calculations
3. Implement lazy loading cho components lớn
4. Test performance impact
5. Update documentation nếu cần
