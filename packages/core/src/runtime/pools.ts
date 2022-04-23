import { robin, Robin } from '../robin'
import { Job, RuntimeProvider } from './createRuntime'
import { fifo, Fifo } from './fifo'

export type LaneName = string
export type PoolId = number
export type Pool = {
  priority: PoolId
  laneNames: Robin<LaneName>
  addLane: (name: keyof Pool['laneNames']) => void
  nextJob: () => Job | undefined
}
export type Lane = {
  name: LaneName
  poolId: PoolId
  jobs: Fifo<Job>
  addJob: (job: Job) => void
}

export const createPoolManager = (provider: RuntimeProvider) => {
  const _pools: Pool[] = []
  const _lanesByName: {
    [laneName: string]: Lane
  } = {}

  const getOrCreatePool = (priority: number) => {
    console.log(`getorCreatePool`, { priority })
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
    const _srcPool = getOrCreatePool(lane.poolId)
    const _dstPool = getOrCreatePool(priority)
    _srcPool.laneNames.remove(lane.name)
    _dstPool.laneNames.add(lane.name)
  }

  const ensureLane = (request: { priority: number; name: string }) => {
    const { name, priority } = request
    const _lane = getOrCreateLane(name)
    getOrCreatePool(priority)
    if (_lane.poolId !== priority) {
      moveLane(_lane, priority)
    }
  }

  const nextJob = () => {
    console.log('nextJob', { _pools })
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
        poolId: provider.getPoolIdByLaneName(name),
        jobs: fifo<Job>(),
        addJob: (job: Job) => {
          _lane.jobs.add(job)
        },
      }
      _lanesByName[name] = _lane
    }
    getOrCreatePool(_lanesByName[name]!.poolId)
    return _lanesByName[name]!
  }

  const addJob = (job: Job) => {
    console.log('adding job', job)
    const lane = getOrCreateLane(job.laneName)
    console.log('lane is', lane)
    lane.addJob(job)
  }

  return {
    addJob,
    nextJob,
    ensureLane,
  }
}
