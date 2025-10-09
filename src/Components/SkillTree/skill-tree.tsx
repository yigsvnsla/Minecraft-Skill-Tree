import { type NormalizedSkillNode, selectAllNodes, selectCanUnlockNode } from "../../features/skill-tree-slice"
import { useAppSelector, useBackgroundMusic, useSkillTreePositions, useViewportDrag } from "../../hooks"
import { SkillTreeCanvas } from "./skill-tree-canvas"
import { SkillTreeContainer } from "./skill-tree-container"
import { SkillTreeNode } from "./skill-tree-node"

export function SkillTree() {
  const nodes = useAppSelector(selectAllNodes)
  const { positions, dimensions } = useSkillTreePositions()
  const { isDragging } = useViewportDrag()

  // Initialize background music
  useBackgroundMusic()

  const { minX, minY, width, height } = dimensions

  return (
    <SkillTreeContainer width={width} height={height}>
      {/* SVG for connection lines */}
      <SkillTreeCanvas
        positions={positions}
        width={width}
        height={height}
        minX={minX}
        minY={minY}
      />

      {/* Nodes */}
      {positions.map((pos, _index) => {
        const node = nodes[pos.nodeId]
        if (!node) return null

        return (
          <div
            key={pos.nodeId}
            className={`absolute skill-tree-node ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}
            style={{
              left: pos.x - minX,
              top: pos.y - minY,
            }}
          >
            <SkillTreeNodeWithCanUnlock node={node} unlocked={pos.unlocked} nodeId={pos.nodeId} />
          </div>
        )
      })}
    </SkillTreeContainer>
  )
}

function SkillTreeNodeWithCanUnlock({ node, unlocked, nodeId }: { node: NormalizedSkillNode; unlocked: boolean; nodeId: string }) {
  const canUnlock = useAppSelector((state) => selectCanUnlockNode(state, nodeId))
  return <SkillTreeNode node={node} unlocked={unlocked} nodeId={nodeId} canUnlock={canUnlock} />
}
