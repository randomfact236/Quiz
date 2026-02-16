import Link from 'next/link';

// Simple error page for Pages Router compatibility
function Error({ statusCode }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, #A5A3E4, #BF7076)',
      padding: '1rem'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '6rem',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '1rem'
        }}>
          {statusCode || 'Error'}
        </h1>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: 'white',
          marginBottom: '1rem'
        }}>
          {statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong'}
        </h2>
        <Link href="/" style={{
          display: 'inline-block',
          backgroundColor: 'white',
          color: '#1f2937',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: 600
        }}>
          Go Home
        </Link>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
