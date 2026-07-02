import { Container, Heading, Text } from '@radix-ui/themes'

export default function Settings() {
  return (
    <Container size="3" style={{ padding: '40px 24px' }}>
      <Heading size="6" mb="2">Pengaturan</Heading>
      <Text size="2" color="gray">Konfigurasi profil pengguna, preferensi audio/video, dan pengaturan akun.</Text>
    </Container>
  )
}
