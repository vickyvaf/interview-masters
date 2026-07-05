import { useNavigate, Link } from 'react-router-dom'
import { Card, Flex, Text, Button, Box } from '@radix-ui/themes'

export default function Register() {
  const navigate = useNavigate()

  const handleGoogleRegister = () => {
    // Simulate register by navigating to dashboard
    navigate('/dashboard')
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', backgroundColor: 'var(--gray-1)', padding: '20px' }}>
      <Card size="3" style={{ width: '100%', maxWidth: '400px', borderRadius: '14px', border: '1px solid var(--gray-4)' }}>
        <Flex direction="column" gap="5" style={{ padding: '8px' }}>
          {/* Logo & Title */}
          <Flex direction="column" gap="1" align="center" style={{ textAlign: 'center' }}>
            <img
              src="/logo.png"
              alt="Interview Masters"
              style={{ width: "48px", height: "48px", marginBottom: "8px" }}
            />
            <Text size="6" weight="bold" style={{ letterSpacing: '-0.5px' }}>
              Interview Masters
            </Text>
            <Text size="2" color="gray">
              Ace your interviews with AI-powered realism
            </Text>
          </Flex>

          <Flex direction="column" gap="3" align="center" style={{ marginTop: '12px' }}>
            <Text size="4" weight="bold">
              Create Your Account
            </Text>
            <Text size="2" color="gray" style={{ textAlign: 'center', marginBottom: '8px' }}>
              Join to practice interviews, customize questions, and monitor stats.
            </Text>
          </Flex>

          {/* Google Sign Up Button */}
          <Button
            size="3"
            variant="surface"
            color="gray"
            onClick={handleGoogleRegister}
            style={{ width: '100%', cursor: 'pointer', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.9c1.69-1.55 2.69-3.85 2.69-6.57z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.23l-2.9-2.24c-.8.54-1.84.87-3.06.87-2.35 0-4.34-1.58-5.05-3.72H.95v2.3C2.43 15.89 5.5 18 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.95 10.68A4.97 4.97 0 0 1 3.5 9c0-.58.1-1.15.28-1.68V5.02H.95A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.95 4.02l3-2.34z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4A8.99 8.99 0 0 0 .95 5.02l3 2.3C4.66 5.16 6.65 3.58 9 3.58z"
              />
            </svg>
            Sign up with Google
          </Button>

          {/* Footer Navigation */}
          <Box style={{ textAlign: 'center', marginTop: '8px' }}>
            <Text size="2" color="gray">
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent-9)', textDecoration: 'none', fontWeight: 'semibold' }}>
                Sign In
              </Link>
            </Text>
          </Box>
        </Flex>
      </Card>
    </Flex>
  )
}
