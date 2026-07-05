import { Card, Button, Text, Heading, Flex, Container, Grid, Badge, Table, Box, Progress, Tooltip, IconButton } from '@radix-ui/themes'
import { Link } from 'react-router-dom'
import { PlusIcon, ChevronRightIcon, ArrowUpIcon, QuestionMarkCircledIcon } from '@radix-ui/react-icons'

export default function DashboardHome() {
  return (
    <Container size="3" style={{ padding: '40px 24px' }}>
      <Flex direction="column" gap="5">
        {/* Header Section */}
        <Flex justify="between" align="center" wrap="wrap" gap="3">
          <Box>
            <Heading size="6" mb="1">Dashboard Utama</Heading>
            <Text size="2" color="gray">
              Pantau progres kesiapan wawancara kerja dan hasil evaluasi AI Anda.
            </Text>
          </Box>
          <Button asChild>
            <Link to="/interview" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <PlusIcon width="16" height="16" /> Mulai Interview Baru
            </Link>
          </Button>
        </Flex>

        {/* Section 1: Success Metrics Overview (PRD / ERD mock_interviews) */}
        <Grid columns={{ initial: '2', md: '4' }} gap="3">
          <Card>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" weight="bold">Skor Rata-rata AI</Text>
              <Heading size="5">82 / 100</Heading>
              <Text size="1" color="green">
                <Flex align="center" gap="1">
                  <ArrowUpIcon /> +4.2% minggu ini
                </Flex>
              </Text>
            </Flex>
          </Card>

          <Card>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" weight="bold">Sesi Selesai</Text>
              <Heading size="5">12 Sesi</Heading>
              <Text size="1" color="gray">Dari total 14 latihan</Text>
            </Flex>
          </Card>

          <Card>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" weight="bold">Kepercayaan Diri</Text>
              <Heading size="5">3.8 / 5.0</Heading>
              <Text size="1" color="green">Meningkat +1.2 poin (post)</Text>
            </Flex>
          </Card>

          <Card>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" weight="bold">Rasio Penyelesaian</Text>
              <Heading size="5">92.3 %</Heading>
              <Text size="1" color="gray">Rasio target sukses latihan</Text>
            </Flex>
          </Card>
        </Grid>

        {/* Section 2: AI Feedbacks Analysis (PRD / ERD ai_feedbacks) */}
        <Box>
          <Flex align="center" gap="2" mb="3">
            <Heading size="4">Analisis Kriteria AI</Heading>
            <Tooltip content={
              <Box style={{ padding: '4px' }}>
                <Text size="2" weight="bold" as="div" mb="2">Skema Penilaian AI</Text>
                <Flex direction="column" gap="1">
                  <Text size="1">• <strong>80% - 100%:</strong> Bagus (Standard Industri)</Text>
                  <Text size="1">• <strong>60% - 79%:</strong> Cukup (Perlu Penyempurnaan)</Text>
                  <Text size="1">• <strong>&lt; 60%:</strong> Kurang (Perlu Latihan Intensif)</Text>
                </Flex>
              </Box>
            }>
              <IconButton variant="ghost" size="1" style={{ cursor: 'pointer', borderRadius: '50%' }}>
                <QuestionMarkCircledIcon width="16" height="16" />
              </IconButton>
            </Tooltip>
          </Flex>
          <Grid columns={{ initial: '1', md: '3' }} gap="4">
            <Card size="2">
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text size="2" weight="bold">Struktur (STAR Method)</Text>
                  <Badge color="green">Bagus</Badge>
                </Flex>
                <Progress value={85} color="green" />
                <Flex justify="between">
                  <Text size="1" color="gray">Rata-rata Skor</Text>
                  <Text size="1" weight="bold">85%</Text>
                </Flex>
              </Flex>
            </Card>

            <Card size="2">
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text size="2" weight="bold">Relevansi Jawaban</Text>
                  <Badge color="amber">Cukup</Badge>
                </Flex>
                <Progress value={78} color="amber" />
                <Flex justify="between">
                  <Text size="1" color="gray">Rata-rata Skor</Text>
                  <Text size="1" weight="bold">78%</Text>
                </Flex>
              </Flex>
            </Card>

            <Card size="2">
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text size="2" weight="bold">Kepadatan (Brevity)</Text>
                  <Badge color="green">Bagus</Badge>
                </Flex>
                <Progress value={80} color="green" />
                <Flex justify="between">
                  <Text size="1" color="gray">Rata-rata Skor</Text>
                  <Text size="1" weight="bold">80%</Text>
                </Flex>
              </Flex>
            </Card>
          </Grid>
        </Box>

        {/* Section 3: Recent Mock Interviews Table (ERD mock_interviews) */}
        <Box>
          <Flex justify="between" align="center" mb="3">
            <Heading size="4">Simulasi Wawancara Terakhir</Heading>
            <Button asChild size="1" variant="ghost">
              <Link to="/history">
                Lihat Semua <ChevronRightIcon />
              </Link>
            </Button>
          </Flex>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Target Peran</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Tanggal</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Mode Respons</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Skor AI</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                <Table.Row>
                  <Table.RowHeaderCell>Software Engineer</Table.RowHeaderCell>
                  <Table.Cell>05 Jul 2026</Table.Cell>
                  <Table.Cell>Suara (Voice)</Table.Cell>
                  <Table.Cell><strong>85 / 100</strong></Table.Cell>
                  <Table.Cell>
                    <Badge color="green" variant="soft">Selesai</Badge>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: 'right' }}>
                    <Button size="1" variant="ghost" asChild>
                      <Link to="/history">Detail</Link>
                    </Button>
                  </Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.RowHeaderCell>Product Manager</Table.RowHeaderCell>
                  <Table.Cell>02 Jul 2026</Table.Cell>
                  <Table.Cell>Teks (Chat)</Table.Cell>
                  <Table.Cell><strong>76 / 100</strong></Table.Cell>
                  <Table.Cell>
                    <Badge color="green" variant="soft">Selesai</Badge>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: 'right' }}>
                    <Button size="1" variant="ghost" asChild>
                      <Link to="/history">Detail</Link>
                    </Button>
                  </Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.RowHeaderCell>Frontend Engineer</Table.RowHeaderCell>
                  <Table.Cell>28 Jun 2026</Table.Cell>
                  <Table.Cell>Suara (Voice)</Table.Cell>
                  <Table.Cell><strong>--</strong></Table.Cell>
                  <Table.Cell>
                    <Badge color="red" variant="soft">Ditinggalkan</Badge>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: 'right' }}>
                    <Button size="1" variant="ghost" asChild>
                      <Link to="/history">Detail</Link>
                    </Button>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          </Card>
        </Box>
      </Flex>
    </Container>
  )
}
