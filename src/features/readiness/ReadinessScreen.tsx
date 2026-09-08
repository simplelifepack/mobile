import React, { useMemo, useState } from 'react';
import { Linking, Pressable } from 'react-native';
import {
  useBootstrapQuery,
  useGeneratePackageMutation,
  usePackageDetailQuery,
  usePackagesQuery,
} from '../../services/api';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { Row } from '../../components/primitives/Row';
import { AppText } from '../../components/primitives/AppText';
import { SearchBar } from '../../components/primitives/SearchBar';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Badge } from '../../components/primitives/Badge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { calculatePackReadiness } from './calculatePackReadiness';
import type { PackageSummary } from '../../api/types';

const categories = [
  'All',
  'Travel & Immigration',
  'Identity & Civic',
  'Money & Tax',
  'Jobs & Employment',
  'Education',
  'Health',
  'Home & Property',
  'Family & Life',
];
function errorMessage(error: unknown) {
  const value = error as { message?: string; error?: string };
  return value?.message ?? value?.error ?? 'Unable to load packages.';
}

export function ReadinessScreen() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const [generated, setGenerated] = useState<PackageSummary | null>(null);
  const packageQuery = {
    category: category === 'All' ? undefined : category,
    search: submittedQuery || undefined,
    page,
    limit: 20,
  };
  const packages = usePackagesQuery(packageQuery);
  const bootstrap = useBootstrapQuery();
  const detail = usePackageDetailQuery(selectedSlug!, { skip: !selectedSlug });
  const [generate, generation] = useGeneratePackageMutation();
  const documents = useMemo(
    () => bootstrap.data?.documents ?? [],
    [bootstrap.data?.documents],
  );
  const items = useMemo(
    () => (generated ? [generated] : (packages.data?.items ?? [])),
    [generated, packages.data?.items],
  );
  const cards = useMemo(
    () =>
      items.map(item => ({
        item,
        readiness: calculatePackReadiness(item.requirements, documents),
      })),
    [documents, items],
  );
  const selected =
    detail.data ?? items.find(item => item.slug === selectedSlug);
  const selectedReadiness = selected
    ? calculatePackReadiness(selected.requirements, documents)
    : null;
  const search = () => {
    setGenerated(null);
    setPage(1);
    setSubmittedQuery(query.trim());
    setSelectedSlug(undefined);
  };
  const generateMissing = async () => {
    const result = await generate({
      packageType: submittedQuery,
      documentLabels: documents.map(
        document =>
          document.normalizedType ?? document.documentType,
      ),
    }).unwrap();
    setGenerated(result.package);
    setSelectedSlug(result.package.slug);
  };
  return (
    <Screen scroll>
      <Stack gap="lg" style={{ paddingVertical: 24 }}>
        <AppText variant="title">Readiness packages</AppText>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
          placeholder="Search packages"
        />
        <Button title="Search" onPress={search} disabled={!query.trim()} />
        <Row gap="sm" style={{ flexWrap: 'wrap' }}>
          {categories.map(item => (
            <Button
              key={item}
              title={item}
              variant={category === item ? 'primary' : 'secondary'}
              onPress={() => {
                setCategory(item);
                setPage(1);
                setGenerated(null);
              }}
            />
          ))}
        </Row>
        {packages.isLoading || bootstrap.isLoading ? (
          <LoadingState label="Loading packages…" />
        ) : packages.error || bootstrap.error ? (
          <Stack gap="md">
            <ErrorState
              message={errorMessage(packages.error ?? bootstrap.error)}
            />
            <Button
              title="Retry"
              onPress={() => {
                packages.refetch();
                bootstrap.refetch();
              }}
            />
          </Stack>
        ) : cards.length === 0 ? (
          <Stack gap="md">
            <EmptyState
              title="No matching packages"
              message={
                submittedQuery
                  ? `No package currently matches “${submittedQuery}”.`
                  : 'No packages are available in this category.'
              }
            />
            {packages.data?.canGenerate && submittedQuery ? (
              <Button
                title={
                  generation.isLoading
                    ? 'Searching official sources…'
                    : 'Search official sources'
                }
                disabled={generation.isLoading}
                onPress={generateMissing}
              />
            ) : null}
            {generation.error ? (
              <AppText color="danger">{errorMessage(generation.error)}</AppText>
            ) : null}
          </Stack>
        ) : (
          <Stack gap="md">
            {cards.map(({ item, readiness }) => (
              <Pressable
                key={item.slug}
                onPress={() => setSelectedSlug(item.slug)}
              >
                <Card>
                  <Stack gap="sm">
                    <Row justify="space-between" align="center">
                      <AppText variant="heading" style={{ flex: 1 }}>
                        {item.title}
                      </AppText>
                      <Badge label={`${readiness.percentage}%`} />
                    </Row>
                    <AppText color="secondary">{item.description}</AppText>
                    <AppText variant="caption" color="muted">
                      {readiness.satisfiedRequired} of {readiness.totalRequired}{' '}
                      required documents ready
                    </AppText>
                  </Stack>
                </Card>
              </Pressable>
            ))}
            {packages.data?.pagination.hasNextPage ? (
              <Button
                title="Load more"
                variant="secondary"
                onPress={() => setPage(value => value + 1)}
              />
            ) : null}
          </Stack>
        )}
        {selected && selectedReadiness ? (
          <Card>
            <Stack gap="md">
              <AppText variant="title">{selected.title}</AppText>
              <AppText color="secondary">{selected.description}</AppText>
              <Badge label={`${selectedReadiness.percentage}% ready`} />
              {selectedReadiness.requirements.map(requirement => (
                <Stack key={requirement.id} gap="xs">
                  <Row justify="space-between">
                    <AppText variant="label" style={{ flex: 1 }}>
                      {requirement.title}
                    </AppText>
                    <AppText
                      color={
                        requirement.status === 'ready' ? 'success' : 'danger'
                      }
                    >
                      {requirement.status === 'ready' ? 'Owned' : 'Missing'}
                    </AppText>
                  </Row>
                  {requirement.description ? (
                    <AppText variant="caption" color="muted">
                      {requirement.description}
                    </AppText>
                  ) : null}
                  {requirement.matchedDocument ? (
                    <AppText variant="caption" color="secondary">
                      {requirement.matchedDocument.displayName ??
                        requirement.matchedDocument.originalName}
                    </AppText>
                  ) : null}
                </Stack>
              ))}
              {selected.source?.url ? (
                <Button
                  title={
                    selected.source.title ??
                    selected.source.name ??
                    'Open official source'
                  }
                  variant="secondary"
                  onPress={() => Linking.openURL(selected.source!.url!)}
                />
              ) : null}
            </Stack>
          </Card>
        ) : detail.isFetching ? (
          <LoadingState label="Loading package details…" />
        ) : detail.error ? (
          <ErrorState message={errorMessage(detail.error)} />
        ) : null}
      </Stack>
    </Screen>
  );
}
