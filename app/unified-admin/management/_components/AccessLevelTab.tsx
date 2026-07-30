"use client";

import { useState } from "react";
import { ModuleRegistry } from "./ModuleRegistry";
import { LevelManager } from "./LevelManager";

interface Props {
  canManage: boolean;
}

export function AccessLevelTab({ canManage }: Props) {
  // Bumped whenever the module registry changes so the level matrix reloads its
  // module rows.
  const [modulesVersion, setModulesVersion] = useState(0);

  return (
    <div className="space-y-8">
      <ModuleRegistry
        canManage={canManage}
        onChanged={() => setModulesVersion((v) => v + 1)}
      />
      <LevelManager canManage={canManage} modulesVersion={modulesVersion} />
    </div>
  );
}
