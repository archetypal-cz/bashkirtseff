export interface OfflineManifest {
  /** Git commit short hash at build time */
  commit: string;
  /** ISO timestamp when manifest was generated */
  built: string;
  /** App version from package.json */
  version: string;
}
