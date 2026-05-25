export default function HistorySkeleton() {
  return (
    <div className="historySkeleton">
      {Array.from({ length: 2 }).map((_, groupIndex) => (
        <div
          className="historyPart historySkeletonPart"
          key={`history-skeleton-${groupIndex}`}
        >
          <span className="historyPartDay">
            <span className="historySkeletonDay skeletonShimmer" />
          </span>
          <div className="historyOperations">
            {Array.from({ length: 4 }).map((_, opIndex) => (
              <div
                className="historyOperation historySkeletonOperation"
                key={`history-skeleton-op-${groupIndex}-${opIndex}`}
              >
                <div className="historyOperationInfo">
                  <div className="historyOperationIcon skeletonShimmer" />
                  <div className="historyOperationInfoColumn">
                    <span className="historySkeletonLine historySkeletonLine--wide skeletonShimmer" />
                    <span className="historySkeletonLine skeletonShimmer" />
                  </div>
                </div>
                <span className="historyOperationAmount historySkeletonAmount skeletonShimmer" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

