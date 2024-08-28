import { core } from '../../modules/core/client/core.client.module';
import { users } from '../../modules/users/client/users.client.module';
import { history } from '../../modules/history/client/history.client.module';
import { schemas } from '../../modules/schemas/client/schemas.client.module';
import { documents } from '../../modules/documents/client/documents.client.module';
import { pods } from '../../modules/pods/client/pods.client.module';
import { projects } from '../../modules/projects/client/projects.client.module';
import { deployments } from '../../modules/deployments/client/deployments.client.module';
import { labels } from '../../modules/labels/client/labels.client.module';
import { groups } from '../../modules/groups/client/groups.client.module';

export default [
  core,
  users,
  history,
  schemas,
  documents,
  pods,
  projects,
  deployments,
  labels,
  groups
];
