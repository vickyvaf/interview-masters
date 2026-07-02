import { Card, Button, Text, Heading, Flex, Container } from '@radix-ui/themes'
import { Link } from 'react-router-dom'

export default function DashboardHome() {
  return (
    <Container size="3" style={{ padding: '40px 24px' }}>
      <Flex direction="column" gap="4">
        <Heading size="6">Dashboard</Heading>
        <Text size="2" color="gray">
          Selamat datang di dashboard persiapan wawancara kerja Anda. Silakan pilih menu untuk memulai simulasi atau meninjau progres.
        </Text>

        <Flex gap="4" wrap="wrap" style={{ marginTop: '16px' }}>
          <Card style={{ width: '320px' }}>
            <Flex direction="column" gap="3" align="start">
              <Heading size="3">Mulai Interview Baru</Heading>
              <Text size="2" color="gray">
                Pilih target peran, unggah deskripsi pekerjaan, dan mulai latihan mock interview.
              </Text>
              <Button asChild size="2">
                <Link to="/playground" style={{ textDecoration: 'none' }}>
                  Latihan Sekarang
                </Link>
              </Button>
            </Flex>
          </Card>

          <Card style={{ width: '320px' }}>
            <Flex direction="column" gap="3" align="start">
              <Heading size="3">Riwayat & Evaluasi</Heading>
              <Text size="2" color="gray">
                Lihat kembali rekaman interview Anda beserta analisis feedback instan dari AI.
              </Text>
              <Button asChild size="2" variant="soft">
                <Link to="/history" style={{ textDecoration: 'none' }}>
                  Lihat Riwayat
                </Link>
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Flex>
    </Container>
  )
}
