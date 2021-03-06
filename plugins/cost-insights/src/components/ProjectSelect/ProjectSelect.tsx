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
import { MenuItem, Select } from '@material-ui/core';
import { Maybe, Project } from '../../types';
import { useSelectStyles as useStyles } from '../../utils/styles';

type ProjectSelectProps = {
  project: Maybe<string>;
  projects: Array<Project>;
  onSelect: (project: Maybe<string>) => void;
};

const ProjectSelect = ({ project, projects, onSelect }: ProjectSelectProps) => {
  const classes = useStyles();

  const projectOptions = [{ id: 'all' } as Project, ...projects]
    .filter(p => p.id)
    .sort((a, b) => (a.id as string).localeCompare(b.id as string));

  const handleOnChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    onSelect(e.target.value as string);
  };

  const renderValue = (value: unknown) => {
    const proj = value as string;
    return (
      <b data-testid={`selected-${proj}`}>
        {proj === 'all' ? 'All Projects' : proj}
      </b>
    );
  };

  return (
    <Select
      className={classes.select}
      variant="outlined"
      value={project}
      renderValue={renderValue}
      onChange={handleOnChange}
      data-testid="project-filter-select"
    >
      {projectOptions.map(proj => (
        <MenuItem
          className={`${classes.menuItem} compact`}
          key={proj.id}
          value={proj.id}
          data-testid={`option-${proj.id}`}
        >
          {proj.id === 'all' ? 'All Projects' : proj.id}
        </MenuItem>
      ))}
    </Select>
  );
};

export default ProjectSelect;
