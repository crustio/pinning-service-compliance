import { v4 as uuidv4 } from 'uuid'

import { TextMatchingStrategy } from '@ipfs-shipyard/pinning-service-client'

import { getInlineCid } from '../../utils/getInlineCid'
import { ApiCall } from '../../ApiCall'
import type { ServiceAndTokenPair } from '../../types'
import { expectNonNullResult, expectOkResponse } from '../../expectations'

const matchApiCallExpectation = async (pair: ServiceAndTokenPair, match: TextMatchingStrategy, name: string) => {
  await new ApiCall({
    pair,
    title: `Can retrieve pin with name '${name}' via the '${match}' TextMatchingStrategy`,
    fn: async (client) => await client.pinsGet({ match, name })
  })
    .expect(expectOkResponse)
    .expect(expectNonNullResult)
    .runExpectations()
}
/**
 * https://github.com/ipfs-shipyard/pinning-service-compliance/issues/9
 */
const matchPin = async (pair: ServiceAndTokenPair) => {
  const name = uuidv4().toLowerCase()
  const nameLength = name.length
  const size = nameLength / 4
  const partialName = name.slice(size, nameLength - (size))
  const cid = await getInlineCid()
  await new ApiCall({
    pair,
    title: `Can create a pin with name='${name}'`,
    fn: async (client) => await client.pinsPost({ pin: { name, cid } })
  })
    .expect(expectOkResponse)
    .expect(expectNonNullResult)
    .expect({
      title: 'Name matches name provided during creation',
      fn: ({ result }) => result?.pin.name === name
    })
    .runExpectations()

  await matchApiCallExpectation(pair, TextMatchingStrategy.Exact, name)
  await matchApiCallExpectation(pair, TextMatchingStrategy.Iexact, name.toUpperCase())
  await matchApiCallExpectation(pair, TextMatchingStrategy.Partial, partialName)
  await matchApiCallExpectation(pair, TextMatchingStrategy.Ipartial, partialName.toUpperCase())
}

export { matchPin }