/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useState } from 'react';
import {
  StatusError,
  StatusAborted,
  StatusOK,
  StatusPending,
  StatusRunning,
  Table,
  TableColumn,
  Link,
} from '@backstage/core';
import {
  Run,
  RunTag,
  Metric,
  EVALUATION_SET_TAG,
  tagToString,
} from '../../MLFlowClient';
import { Chip, Button } from '@material-ui/core';

export const RunTable = ({ runs }: { runs: Run[] }) => {
  const [evaluationSetsToFilter, setEvaluationSetsToFilter] = useState<
    Set<string>
  >(new Set());
  const [tagsToFilter, setTagsToFilter] = useState<Set<string>>(new Set());

  const allMetricNames: Set<string> = new Set(
    runs.flatMap(run => (run.data.metrics || []).map(m => m.key)),
  );

  // Define the columns as the standard things and then all of the unique metric values
  const columns: TableColumn[] = [
    { title: 'Status', field: 'status', width: '40px' },
    { title: 'Run ID', field: 'run_id' },
    { title: 'Start Time', field: 'start_time' },
    { title: 'Lifecycle', field: 'lifecycle_stage' },
    { title: 'Evaluation Sets', field: 'evaluation_sets' },
    { title: 'Tags', field: 'tags' },
  ].concat(Array.from(allMetricNames).map(k => ({ title: k, field: k })));

  function handleEvaluationSetFilter(label: string) {
    const newSet: Set<string> = new Set(evaluationSetsToFilter);
    if (newSet.has(label)) {
      newSet.delete(label);
    } else {
      newSet.add(label);
    }
    setEvaluationSetsToFilter(newSet);
  }

  function handleTagFilter(runTag: RunTag) {
    const kv = tagToString(runTag);
    const newSet: Set<string> = new Set(tagsToFilter);
    if (newSet.has(kv)) {
      newSet.delete(kv);
    } else {
      newSet.add(kv);
    }
    setTagsToFilter(newSet);
  }

  const data = runs
    // Apply filter on the evaluation sets to keep
    .filter(run => {
      if (evaluationSetsToFilter.size === 0) {
        return true;
      }
      const evalSetTag = (run.data.tags || []).find(
        tag => tag.key === EVALUATION_SET_TAG,
      );
      return evalSetTag && evaluationSetsToFilter.has(evalSetTag.value);
    })
    .filter(run => {
      return (
        tagsToFilter.size === 0 ||
        (run.data.tags || []).filter(tag => tagsToFilter.has(tagToString(tag)))
          .length > 0
      );
    })
    .map(run => {
      // Extract all of the metrics into a map<key, value>
      const metricValues: Record<string, number> = (
        run.data.metrics || []
      ).reduce((map: Record<string, number>, metric: Metric) => {
        map[metric.key] = metric.value;
        return map;
      }, {});

      // build all of the rest of the colums and add in the metrics at the end.
      return {
        status: makeStatus(run.info.status),
        run_id: <Link to={`${run.info.run_id}`}>{run.info.run_id}</Link>,
        start_time: new Date(run.info.start_time * 1).toLocaleString(),
        lifecycle_stage: run.info.lifecycle_stage,
        tags: run.data.tags
          .filter(tag => !tag.key.startsWith('mlflow.'))
          .map((tag, i) => (
            <Chip
              key={i}
              label={tag.value}
              onClick={() => handleTagFilter(tag)}
            />
          )),
        evaluation_sets: run.data.tags
          .filter(tag => tag.key === EVALUATION_SET_TAG)
          .map((tag, i) => (
            <Chip
              key={i}
              label={tag.value}
              onClick={() => handleEvaluationSetFilter(tag.value)}
            />
          )),
        ...metricValues,
      };
    });

  const enableFilterButton =
    evaluationSetsToFilter.size > 0 || tagsToFilter.size > 0;

  function clearAllFilters() {
    setEvaluationSetsToFilter(new Set());
    setTagsToFilter(new Set());
  }
  return (
    <>
      <Table
        data-testid="RunTable"
        title="Latest Runs"
        options={{ search: false, paging: false }}
        columns={columns}
        data={data}
      />
      <Button
        color="primary"
        variant="contained"
        onClick={clearAllFilters}
        disabled={!enableFilterButton}
      >
        Clear All Filters
      </Button>
    </>
  );
};

function makeStatus(status: string) {
  switch (status) {
    case 'FINISHED':
      return <StatusOK />;
    case 'FAILED':
      return <StatusError />;
    case 'KILLED':
      return <StatusAborted />;
    case 'RUNNING':
      return <StatusRunning />;
    case 'SCHEDULED':
      return <StatusPending />;
    default:
      // This shouldn't happen because the match is exhaustive.
      return <StatusPending />;
  }
}
