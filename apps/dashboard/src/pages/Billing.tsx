import { Container, Heading, Text } from '@radix-ui/themes'

export default function Billing() {
  return (
    <Container size="3" style={{ padding: '40px 24px' }}>
      <Heading size="6" mb="2">Billing & Langganan</Heading>
      <Text size="2" color="gray">Kelola status langganan Pro, batas kuota, dan invoices pembayaran.</Text>
    </Container>
  )
}
