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

import React from 'react';
import { render } from '@testing-library/react';
import { DeploymentTables } from './DeploymentTables';
import * as twoDeployFixture from './__fixtures__/2-deployments.json';
import { wrapInTestApp } from '@backstage/test-utils';

describe('DeploymentTables', () => {
  it('should render 2 deployments', async () => {
    const { getByText } = render(
      wrapInTestApp(
        <DeploymentTables deploymentTriple={twoDeployFixture as any} />,
      ),
    );

    // title
    expect(getByText('dice-roller')).toBeInTheDocument();
    expect(getByText('dice-roller-canary')).toBeInTheDocument();

    // pod names
    expect(getByText('dice-roller-6c8646bfd-2m5hv')).toBeInTheDocument();
    expect(
      getByText('dice-roller-canary-7d64cd756c-55rfq'),
    ).toBeInTheDocument();
  });
});
