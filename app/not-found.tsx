// 404 页面不需要导入 locales

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '4rem', margin: '0' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '10px 0' }}>页面未找到</h2>
      <p style={{ fontSize: '1rem', color: '#666', margin: '10px 0' }}>
        抱歉，您访问的页面不存在。
      </p>
      <a 
        href="/" 
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px'
        }}
      >
        返回首页
      </a>
    </div>
  );
}
