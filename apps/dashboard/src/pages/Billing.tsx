import { Container, Heading, Text, Flex, Grid, Card, Button, Badge, Separator, Box } from '@radix-ui/themes'
import { CheckIcon, StarIcon } from '@radix-ui/react-icons'

export default function Billing() {
  return (
    <Container size="3" style={{ padding: '40px 24px' }}>
      <Flex direction="column" gap="5">
        {/* Header Section */}
        <Box>
          <Heading size="6" mb="1">Billing & Langganan</Heading>
          <Text size="2" color="gray">
            Pilih paket yang sesuai untuk mengoptimalkan persiapan wawancara kerja Anda.
          </Text>
        </Box>


        {/* Current Subscription Status */}
        <Card size="3" style={{ background: 'var(--accent-2)' }}>
          <Flex justify="between" align="center" wrap="wrap" gap="4">
            <Flex direction="column" gap="1">
              <Flex align="center" gap="2">
                <Text size="2" weight="bold" color="gray">
                  Paket Aktif Anda
                </Text>
                <Badge color="blue" variant="solid">Free Trial</Badge>
              </Flex>
              <Heading size="2">Free Tier (Gratis)</Heading>
              <Text size="2" color="gray">
                Sisa kuota: <strong>3 mock interviews</strong> bulan ini.
              </Text>
            </Flex>
            <Button variant="soft" color="blue">
              Upgrade ke Pro
            </Button>
          </Flex>
        </Card>


        <Separator size="4" />


        {/* Pricing Grid */}
        <Box>
          <Heading size="4" mb="4">Paket & Layanan Tersedia</Heading>
          <Grid columns={{ initial: '1', md: '3' }} gap="4">
            {/* Free Plan */}
            <Card size="3">
              <Flex direction="column" gap="4" style={{ height: '100%' }}>
                <Flex direction="column" gap="1">
                  <Heading size="3">Free</Heading>
                  <Text size="1" color="gray">Untuk perkenalan awal</Text>
                </Flex>

                <Flex align="baseline" gap="1">
                  <Text size="6" weight="bold">Rp 0</Text>
                  <Text size="2" color="gray">/ bulan</Text>
                </Flex>


                <Separator size="4" />


                <Flex direction="column" gap="2" style={{ flexGrow: 1 }}>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">3 mock interviews / bulan</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Umpan balik dasar (basic feedback)</Text>
                  </Flex>
                </Flex>


                <Button size="2" variant="outline" disabled style={{ marginTop: 'auto' }}>
                  Paket Aktif
                </Button>
              </Flex>
            </Card>


            {/* Pro Plan */}
            <Card size="3" style={{ border: '2px solid var(--accent-9)' }}>
              <Flex direction="column" gap="4" style={{ height: '100%' }}>
                <Flex justify="between" align="start">
                  <Flex direction="column" gap="1">
                    <Heading size="3">Pro</Heading>
                    <Text size="1" color="gray">Untuk pencari kerja aktif</Text>
                  </Flex>
                  <Badge size="2" variant="solid">
                    <Flex align="center" gap="1">
                      <StarIcon /> Populer
                    </Flex>
                  </Badge>
                </Flex>

                <Flex align="baseline" gap="1">
                  <Text size="6" weight="bold">Rp 99.000</Text>
                  <Text size="2" color="gray">/ bulan</Text>
                </Flex>


                <Separator size="4" />


                <Flex direction="column" gap="2" style={{ flexGrow: 1 }}>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Sesi latihan tanpa batas (unlimited)</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Umpan balik AI tingkat lanjut</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Analitik progres latihan</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Role deep-dive kustom</Text>
                  </Flex>
                </Flex>


                <Button size="2" variant="solid" style={{ marginTop: 'auto' }}>
                  Langganan Pro
                </Button>
              </Flex>
            </Card>

            {/* 14-day Interview Sprint Plan */}
            <Card size="3">
              <Flex direction="column" gap="4" style={{ height: '100%' }}>
                <Flex direction="column" gap="1">
                  <Flex align="center" gap="2">
                    <Heading size="3">14-Day Sprint</Heading>
                    <Badge color="orange">Spesial</Badge>
                  </Flex>
                  <Text size="1" color="gray">Persiapan intensif waktu singkat</Text>
                </Flex>

                <Flex align="baseline" gap="1">
                  <Text size="6" weight="bold">Rp 390.000</Text>
                  <Text size="2" color="gray">/ paket (~$25)</Text>
                </Flex>

                <Separator size="4" />

                <Flex direction="column" gap="2" style={{ flexGrow: 1 }}>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Masa aktif program 14 hari</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Umpan balik instan & terstruktur</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Pertanyaan posisi spesifik & custom</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Dirancang khusus untuk wawancara &lt; 30 hari</Text>
                  </Flex>
                </Flex>

                <Button size="2" variant="solid" color="orange" style={{ marginTop: 'auto' }}>
                  Beli Paket Sprint
                </Button>
              </Flex>
            </Card>
          </Grid>
        </Box>

        {/* B2B Plan Footer */}
        <Card size="2" style={{ marginTop: '16px' }}>
          <Flex justify="between" align="center" wrap="wrap" gap="3">
            <Flex direction="column" gap="1">
              <Heading size="3">Kebutuhan Organisasi / B2B?</Heading>
              <Text size="2" color="gray">
                Kami menyediakan lisensi massal, dasboard HR terintegrasi, dan kustomisasi pelacakan kandidat untuk universitas atau bootcamp.
              </Text>
            </Flex>
            <Button size="2" variant="outline">
              Hubungi Kami
            </Button>
          </Flex>
        </Card>
      </Flex>
    </Container>
  )
}

