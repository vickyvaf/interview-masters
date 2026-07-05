import { Container, Heading, Text, Flex, Card, Button, Separator, Box, Grid, TextField, TextArea, Select, Switch } from '@radix-ui/themes'
import { Link } from 'react-router-dom'
import { PersonIcon, MixerHorizontalIcon, GearIcon, Link2Icon } from '@radix-ui/react-icons'

export default function Settings() {
  return (
    <Container size="3" style={{ padding: '40px 24px' }}>
      <Flex direction="column" gap="5">
        {/* Header */}
        <Box>
          <Heading size="6" mb="1">Pengaturan</Heading>
          <Text size="2" color="gray">
            Sesuaikan profil, preferensi simulasi wawancara AI, dan konfigurasi akun Anda.
          </Text>
        </Box>

        <Separator size="4" />

        {/* Section 1: Profil Pengguna */}
        <Box>
          <Heading size="4" mb="3">
            <Flex align="center" gap="2">
              <PersonIcon /> Profil Pengguna
            </Flex>
          </Heading>
          <Card size="3">
            <Flex direction="column" gap="4">
              <Grid columns={{ initial: '1', md: '2' }} gap="4">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="bold">Nama Lengkap</Text>
                  <TextField.Root placeholder="Masukkan nama lengkap Anda" defaultValue="John Doe" />
                </Flex>
                <Flex direction="column" gap="1">
                  <Text size="2" weight="bold">Alamat Email</Text>
                  <TextField.Root placeholder="Masukkan email Anda" defaultValue="johndoe@example.com" type="email" />
                </Flex>
              </Grid>

              <Flex direction="column" gap="1">
                <Text size="2" weight="bold">Peran / Pekerjaan Saat Ini</Text>
                <Box maxWidth="240px">
                  <Select.Root defaultValue="job_seeker">
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="student">Mahasiswa / Fresh Graduate</Select.Item>
                      <Select.Item value="job_seeker">Pencari Kerja Aktif</Select.Item>
                      <Select.Item value="professional">Profesional Berpengalaman</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
              </Flex>
            </Flex>
          </Card>
        </Box>

        {/* Section 2: Preferensi Wawancara (refer PRD & ERD) */}
        <Box>
          <Heading size="4" mb="3">
            <Flex align="center" gap="2">
              <GearIcon /> Preferensi Wawancara AI
            </Flex>
          </Heading>
          <Card size="3">
            <Flex direction="column" gap="4">
              <Grid columns={{ initial: '1', md: '2' }} gap="4">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="bold">Target Jabatan / Posisi Kerja</Text>
                  <TextField.Root placeholder="e.g. Software Engineer, Marketing Lead" defaultValue="Software Engineer" />
                </Flex>
                <Flex direction="column" gap="1">
                  <Text size="2" weight="bold">Bahasa Wawancara Utama</Text>
                  <Box>
                    <Select.Root defaultValue="id">
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="id">Bahasa Indonesia (ID)</Select.Item>
                        <Select.Item value="en">English (EN)</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Box>
                </Flex>
              </Grid>

              <Flex direction="column" gap="1">
                <Text size="2" weight="bold">Deskripsi Pekerjaan Default (Job Description)</Text>
                <TextArea placeholder="Tempel deskripsi pekerjaan target Anda di sini agar AI menyesuaikan pertanyaannya secara otomatis..." rows={5} />
              </Flex>

              <Flex direction="column" gap="1">
                <Text size="2" weight="bold">Resume / Ringkasan Pengalaman</Text>
                <TextArea placeholder="Tempel ringkasan CV / Resume Anda di sini..." rows={5} />
              </Flex>
            </Flex>
          </Card>
        </Box>

        {/* Section 3: Konfigurasi Perangkat (refer Playground & backend config) */}
        <Box>
          <Heading size="4" mb="3">
            <Flex align="center" gap="2">
              <MixerHorizontalIcon /> Fitur & Perangkat
            </Flex>
          </Heading>
          <Card size="3">
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Box>
                  <Text size="2" weight="bold">Aktifkan Kamera Saat Mulai</Text>
                  <Text size="1" color="gray" as="div">Membuka umpan balik kamera secara otomatis ketika sesi dimulai.</Text>
                </Box>
                <Switch defaultChecked />
              </Flex>

              <Separator size="4" />

              <Flex justify="between" align="center">
                <Box>
                  <Text size="2" weight="bold">Mode Respons Default</Text>
                  <Text size="1" color="gray" as="div">Pilih antara menggunakan input suara (STT) atau pengetikan teks manual.</Text>
                </Box>
                <Select.Root defaultValue="voice">
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="voice">Suara / Audio</Select.Item>
                    <Select.Item value="text">Teks / Chat</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Flex>
            </Flex>
          </Card>
        </Box>

        {/* Section 4: Informasi Langganan (refer ERD & Billing) */}
        <Box>
          <Heading size="4" mb="3">
            <Flex align="center" gap="2">
              <Link2Icon /> Langganan & Akun
            </Flex>
          </Heading>
          <Card size="3" style={{ background: 'var(--gray-2)' }}>
            <Flex justify="between" align="center" wrap="wrap" gap="3">
              <Box>
                <Text size="2" weight="bold">Tipe Langganan Anda: Free Tier</Text>
                <Text size="1" color="gray" as="div">
                  Upgrade ke Pro untuk simulasi tanpa batas dan analisis mendalam dari AI.
                </Text>
              </Box>
              <Button asChild variant="outline">
                <Link to="/billing">Kelola Billing</Link>
              </Button>
            </Flex>
          </Card>
        </Box>

        {/* Action Buttons */}
        <Flex gap="3" justify="end" style={{ marginTop: '16px' }}>
          <Button variant="soft" color="gray">
            Batal
          </Button>
          <Button variant="solid">
            Simpan Perubahan
          </Button>
        </Flex>
      </Flex>
    </Container>
  )
}
