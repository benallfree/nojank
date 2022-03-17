import { DEFAULT_SWIMLANE_NAME, _globalConfig } from './config'
import { fifo } from './fifo'
import { robin } from './robin'
import { Job, Lane, LaneName, Pool } from './run'

export const createPoolManager = () => {
  const _pools: Pool[] = []
  const _lanesByName: {
    [laneName: string]: Lane
  } = {}

  const getOrCreatePool = (priority: number) => {
    const _pool = _pools.find((e) => (e.priority = priority))
    if (_pool) return _pool
    {
      const _pool: Pool = {
        priority,
        laneNames: robin<LaneName>(),
        addLane: (name) => {
          if (_pool.laneNames[name]) return
          _pool.laneNames.add(name)
        },
        nextJob: () => {
          const nextLaneName = _pool.laneNames.next((laneName) => {
            const _lane = _lanesByName[laneName]
            if (!_lane) {
              throw new Error(`Expected lane ${laneName} to exist`)
            }
            return !_lane.jobs.empty()
          })
          if (!nextLaneName) return undefined
          const lane = _lanesByName[nextLaneName]
          if (!lane) {
            throw new Error(`Lane name ${nextLaneName} does not exist`)
          }
          return lane.jobs.next()
        },
      }
      _pools.push(_pool)
      _pools.sort((a, b) => b.priority - a.priority)
      return _pool
    }
  }

  const moveLane = (lane: Lane, priority: number) => {
    const _srcPool = getOrCreatePool(lane.priority)
    const _dstPool = getOrCreatePool(priority)
    _srcPool.laneNames.remove(lane.name)
    _dstPool.laneNames.add(lane.name)
  }

  const ensureLane = (request: { priority: number; name: string }) => {
    const { name, priority } = request
    const _lane = getOrCreateLane(name)
    if (_lane.priority !== priority) {
      moveLane(_lane, priority)
    }
  }

  const nextJob = () => {
    for (let i = 0; i < _pools.length; i++) {
      const _pool = _pools[i]!
      const job = _pool.nextJob()
      if (job) {
        return job
      }
    }
    return undefined
  }

  const getOrCreateLane = (name: string) => {
    if (!_lanesByName[name]) {
      const _lane: Lane = {
        name,
        priority:
          _globalConfig.lanes[name]?.priority ||
          _globalConfig.lanes[DEFAULT_SWIMLANE_NAME].priority,
        jobs: fifo<Job>(),
        addJob: (job: Job) => {
          _lane.jobs.add(job)
        },
      }
      _lanesByName[name] = _lane
    }
    return _lanesByName[name]!
  }

  const addJob = (job: Job) => {
    const lane = getOrCreateLane(job.laneName)
    lane.addJob(job)
  }

  return {
    addJob,
    nextJob,
    ensureLane,
  }
}
