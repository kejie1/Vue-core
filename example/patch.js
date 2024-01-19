/*
 * @Author: ChuandongHuang chuandong_huang@human-horizons.com
 * @Date: 2024-01-19 10:22:43
 * @LastEditors: ChuandongHuang chuandong_huang@human-horizons.com
 * @LastEditTime: 2024-01-19 10:24:36
 * @Description:
 */
// 循环更新子节点
function updateChildren(
  parentElm,
  oldCh,
  newCh,
  insertedVnodeQueue,
  removeOnly
) {
  let oldStartIdx = 0; // oldChildren开始索引
  let oldEndIdx = oldCh.length - 1; // oldChildren结束索引
  let oldStartVnode = oldCh[0]; // oldChildren中所有未处理节点中的第一个
  let oldEndVnode = oldCh[oldEndIdx]; // oldChildren中所有未处理节点中的最后一个

  let newStartIdx = 0; // newChildren开始索引
  let newEndIdx = newCh.length - 1; // newChildren结束索引
  let newStartVnode = newCh[0]; // newChildren中所有未处理节点中的第一个
  let newEndVnode = newCh[newEndIdx]; // newChildren中所有未处理节点中的最后一个

  let oldKeyToIdx, idxInOld, vnodeToMove, refElm;

  // removeOnly is a special flag used only by <transition-group>
  // to ensure removed elements stay in correct relative positions
  // during leaving transitions
  const canMove = !removeOnly;

  if (process.env.NODE_ENV !== "production") {
    checkDuplicateKeys(newCh);
  }

  // 以"新前"、"新后"、"旧前"、"旧后"的方式开始比对节点
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      oldStartVnode = oldCh[++oldStartIdx]; // 如果oldStartVnode不存在，则直接跳过，比对下一个
    } else if (isUndef(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 如果新前与旧前节点相同，就把两个节点进行patch更新
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 如果新后与旧后节点相同，就把两个节点进行patch更新
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // Vnode moved right
      // 如果新后与旧前节点相同，先把两个节点进行patch更新，然后把旧前节点移动到oldChilren中所有未处理节点之后
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
      canMove &&
        nodeOps.insertBefore(
          parentElm,
          oldStartVnode.elm,
          nodeOps.nextSibling(oldEndVnode.elm)
        );
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      // 如果新前与旧后节点相同，先把两个节点进行patch更新，然后把旧后节点移动到oldChilren中所有未处理节点之前
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
      canMove &&
        nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // 如果不属于以上四种情况，就进行常规的循环比对patch
      if (isUndef(oldKeyToIdx))
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
      // 如果在oldChildren里找不到当前循环的newChildren里的子节点
      if (isUndef(idxInOld)) {
        // New element
        // 新增节点并插入到合适位置
        createElm(
          newStartVnode,
          insertedVnodeQueue,
          parentElm,
          oldStartVnode.elm,
          false,
          newCh,
          newStartIdx
        );
      } else {
        // 如果在oldChildren里找到了当前循环的newChildren里的子节点
        vnodeToMove = oldCh[idxInOld];
        // 如果两个节点相同
        if (sameVnode(vnodeToMove, newStartVnode)) {
          // 调用patchVnode更新节点
          patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue);
          oldCh[idxInOld] = undefined;
          // canmove表示是否需要移动节点，如果为true表示需要移动，则移动节点，如果为false则不用移动
          canMove &&
            nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
        } else {
          // same key but different element. treat as new element
          createElm(
            newStartVnode,
            insertedVnodeQueue,
            parentElm,
            oldStartVnode.elm,
            false,
            newCh,
            newStartIdx
          );
        }
      }
      newStartVnode = newCh[++newStartIdx];
    }
  }
  if (oldStartIdx > oldEndIdx) {
    /**
     * 如果oldChildren比newChildren先循环完毕，
     * 那么newChildren里面剩余的节点都是需要新增的节点，
     * 把[newStartIdx, newEndIdx]之间的所有节点都插入到DOM中
     */
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
    addVnodes(
      parentElm,
      refElm,
      newCh,
      newStartIdx,
      newEndIdx,
      insertedVnodeQueue
    );
  } else if (newStartIdx > newEndIdx) {
    /**
     * 如果newChildren比oldChildren先循环完毕，
     * 那么oldChildren里面剩余的节点都是需要删除的节点，
     * 把[oldStartIdx, oldEndIdx]之间的所有节点都删除
     */
    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
  }
}
