import { Card, Button, Text, Heading, Flex, Container, Grid, Badge, Table, Box, Progress, Tooltip, IconButton, Skeleton } from '@radix-ui/themes'
import { Link } from 'react-router-dom'
import { PlusIcon, ChevronRightIcon, ArrowUpIcon, QuestionMarkCircledIcon } from '@radix-ui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export default function DashboardHome() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      // 1. Fetch mock interviews
      const { data: interviews, error: interviewsError } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (interviewsError) throw interviewsError

      const totalSessions = interviews?.length || 0
      const completedInterviews = interviews?.filter(i => i.status === 'completed') || []
      const completedSessions = completedInterviews.length
      const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

      // Overall Score
      const scores = completedInterviews.map(i => i.overall_score).filter(s => s !== null && s !== undefined) as number[]
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

      // Confidence Scores
      const preScores = interviews?.map(i => i.pre_confidence_score).filter(s => s !== null && s !== undefined) as number[] || []
      const postScores = interviews?.map(i => i.post_confidence_score).filter(s => s !== null && s !== undefined) as number[] || []
      const avgPre = preScores.length > 0 ? preScores.reduce((a, b) => a + b, 0) / preScores.length : 0
      const avgPost = postScores.length > 0 ? postScores.reduce((a, b) => a + b, 0) / postScores.length : 0
      const confidenceGain = avgPost - avgPre

      // 2. Fetch AI Feedbacks associated with this user's interviews
      const { data: feedbacks, error: feedbacksError } = await supabase
        .from('ai_feedbacks')
        .select(`
          structure_score,
          relevance_score,
          brevity_score,
          interview_answers!inner (
            interview_questions!inner (
              mock_interviews!inner (
                user_id
              )
            )
          )
        `)
        .eq('interview_answers.interview_questions.mock_interviews.user_id', user.id)

      if (feedbacksError) throw feedbacksError

      const structureScores = feedbacks?.map(f => f.structure_score).filter(s => s !== null) as number[] || []
      const relevanceScores = feedbacks?.map(f => f.relevance_score).filter(s => s !== null) as number[] || []
      const brevityScores = feedbacks?.map(f => f.brevity_score).filter(s => s !== null) as number[] || []

      const avgStructure = structureScores.length > 0 ? Math.round(structureScores.reduce((a, b) => a + b, 0) / structureScores.length) : 0
      const avgRelevance = relevanceScores.length > 0 ? Math.round(relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length) : 0
      const avgBrevity = brevityScores.length > 0 ? Math.round(brevityScores.reduce((a, b) => a + b, 0) / brevityScores.length) : 0

      // Recent 3 interviews for display
      const recentInterviews = interviews?.slice(0, 3) || []

      return {
        avgScore,
        completedSessions,
        totalSessions,
        confidenceRating: avgPost > 0 ? avgPost.toFixed(1) : (avgPre > 0 ? avgPre.toFixed(1) : '0.0'),
        confidenceGain,
        completionRate: completionRate.toFixed(1),
        avgStructure,
        avgRelevance,
        avgBrevity,
        recentInterviews
      }
    }
  })

  const getBadgeColor = (score: number) => {
    if (score >= 80) return 'green'
    if (score >= 60) return 'amber'
    return 'red'
  }

  const getBadgeLabel = (score: number) => {
    if (score >= 80) return 'Bagus'
    if (score >= 60) return 'Cukup'
    return 'Kurang'
  }

  const formatRoleLabel = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Container size="3" style={{ padding: '40px 24px' }}>
        <Flex direction="column" gap="5">
          {/* Header Skeleton */}
          <Box>
            <Skeleton height="32px" width="180px" style={{ marginBottom: '8px' }} />
            <Skeleton height="16px" width="400px" />
          </Box>

          {/* Grid Overview Skeletons */}
          <Grid columns={{ initial: '2', md: '4' }} gap="3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Flex direction="column" gap="2">
                  <Skeleton height="12px" width="80px" />
                  <Skeleton height="28px" width="100px" />
                  <Skeleton height="12px" width="60px" />
                </Flex>
              </Card>
            ))}
          </Grid>

          {/* Section 2 Title Skeleton */}
          <Box>
            <Skeleton height="24px" width="150px" style={{ marginBottom: '12px' }} />
            <Grid columns={{ initial: '1', md: '3' }} gap="4">
              {[1, 2, 3].map((i) => (
                <Card key={i} size="2">
                  <Flex direction="column" gap="3">
                    <Flex justify="between" align="center">
                      <Skeleton height="16px" width="120px" />
                      <Skeleton height="18px" width="50px" />
                    </Flex>
                    <Skeleton height="8px" width="100%" />
                    <Flex justify="between">
                      <Skeleton height="12px" width="60px" />
                      <Skeleton height="12px" width="30px" />
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Box>
        </Flex>
      </Container>
    )
  }

  // Fallback defaults if no metrics exist yet
  const stats = metrics || {
    avgScore: 0,
    completedSessions: 0,
    totalSessions: 0,
    confidenceRating: '0.0',
    confidenceGain: 0,
    completionRate: '0.0',
    avgStructure: 0,
    avgRelevance: 0,
    avgBrevity: 0,
    recentInterviews: []
  }

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

        {/* Section 1: Success Metrics Overview */}
        <Grid columns={{ initial: '2', md: '4' }} gap="3">
          <Card>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" weight="bold">Skor Rata-rata AI</Text>
              <Heading size="5">{stats.avgScore} / 100</Heading>
              {stats.totalSessions > 0 && (
                <Text size="1" color="green">
                  <Flex align="center" gap="1">
                    <ArrowUpIcon /> +0.0% minggu ini
                  </Flex>
                </Text>
              )}
            </Flex>
          </Card>

          <Card>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" weight="bold">Sesi Selesai</Text>
              <Heading size="5">{stats.completedSessions} Sesi</Heading>
              <Text size="1" color="gray">Dari total {stats.totalSessions} latihan</Text>
            </Flex>
          </Card>

          <Card>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" weight="bold">Kepercayaan Diri</Text>
              <Heading size="5">{stats.confidenceRating} / 5.0</Heading>
              {stats.totalSessions > 0 && (
                <Text size="1" color={stats.confidenceGain >= 0 ? 'green' : 'red'}>
                  {stats.confidenceGain >= 0 
                    ? `Meningkat +${stats.confidenceGain.toFixed(1)} poin (post)` 
                    : `Menurun ${stats.confidenceGain.toFixed(1)} poin (post)`}
                </Text>
              )}
            </Flex>
          </Card>

          <Card>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" weight="bold">Rasio Penyelesaian</Text>
              <Heading size="5">{stats.completionRate} %</Heading>
              <Text size="1" color="gray">Rasio target sukses latihan</Text>
            </Flex>
          </Card>
        </Grid>

        {/* Section 2: AI Feedbacks Analysis */}
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
                  {stats.avgStructure > 0 && (
                    <Badge color={getBadgeColor(stats.avgStructure)}>{getBadgeLabel(stats.avgStructure)}</Badge>
                  )}
                </Flex>
                <Progress value={stats.avgStructure} color={getBadgeColor(stats.avgStructure) || 'gray'} />
                <Flex justify="between">
                  <Text size="1" color="gray">Rata-rata Skor</Text>
                  <Text size="1" weight="bold">{stats.avgStructure}%</Text>
                </Flex>
              </Flex>
            </Card>

            <Card size="2">
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text size="2" weight="bold">Relevansi Jawaban</Text>
                  {stats.avgRelevance > 0 && (
                    <Badge color={getBadgeColor(stats.avgRelevance)}>{getBadgeLabel(stats.avgRelevance)}</Badge>
                  )}
                </Flex>
                <Progress value={stats.avgRelevance} color={getBadgeColor(stats.avgRelevance) || 'gray'} />
                <Flex justify="between">
                  <Text size="1" color="gray">Rata-rata Skor</Text>
                  <Text size="1" weight="bold">{stats.avgRelevance}%</Text>
                </Flex>
              </Flex>
            </Card>

            <Card size="2">
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text size="2" weight="bold">Kepadatan (Brevity)</Text>
                  {stats.avgBrevity > 0 && (
                    <Badge color={getBadgeColor(stats.avgBrevity)}>{getBadgeLabel(stats.avgBrevity)}</Badge>
                  )}
                </Flex>
                <Progress value={stats.avgBrevity} color={getBadgeColor(stats.avgBrevity) || 'gray'} />
                <Flex justify="between">
                  <Text size="1" color="gray">Rata-rata Skor</Text>
                  <Text size="1" weight="bold">{stats.avgBrevity}%</Text>
                </Flex>
              </Flex>
            </Card>
          </Grid>
        </Box>

        {/* Section 3: Recent Mock Interviews Table */}
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
                  <Table.ColumnHeaderCell>Skor AI</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {stats.recentInterviews.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                      <Text size="2" color="gray">Belum ada simulasi wawancara. Klik "Mulai Interview Baru" untuk mencoba.</Text>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  stats.recentInterviews.map((interview: any) => (
                    <Table.Row key={interview.id}>
                      <Table.RowHeaderCell>{formatRoleLabel(interview.target_role)}</Table.RowHeaderCell>
                      <Table.Cell>{formatDate(interview.created_at)}</Table.Cell>
                      <Table.Cell>
                        <strong>{interview.overall_score ? `${interview.overall_score} / 100` : '--'}</strong>
                      </Table.Cell>
                      <Table.Cell>
                        {interview.status === 'completed' && <Badge color="green" variant="soft">Selesai</Badge>}
                        {interview.status === 'started' && <Badge color="blue" variant="soft">Dimulai</Badge>}
                        {interview.status === 'abandoned' && <Badge color="red" variant="soft">Ditinggalkan</Badge>}
                      </Table.Cell>
                      <Table.Cell style={{ textAlign: 'right' }}>
                        <Button size="1" variant="ghost" asChild>
                          <Link to="/history">Detail</Link>
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          </Card>
        </Box>
      </Flex>
    </Container>
  )
}
