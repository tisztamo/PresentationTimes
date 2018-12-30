import { me, postTransaction, getTransaction } from "./chain.js"

export function tokenLaunch(nTokens=5*5*1000) {
    const creator = me()
    const tx = BigchainDB.Transaction.makeCreateTransaction({
            token: 'BPNT Time Token',
            number_tokens: nTokens
        },
        {
            datetime: new Date().toString()
        },
        [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction
            .makeEd25519Condition(creator.publicKey), nTokens.toString())],
        creator.publicKey
    )

    return postTransaction(tx).then(res => {
        return {
            id: res.id,
            tokensLeft: nTokens,
            creator: creator,
            createTx: res,
            issue: function(receiver, amount) {
                return giveTokens(this, receiver, amount)
            }
        }
    })
}

export function giveTokens(token, receiver, amount) {
   return getTransaction(token.id).then(createOutputs => {
        const tx = BigchainDB.Transaction.makeTransferTransaction(
            [{
                tx: createOutputs,
                output_index: 0
            }],
            [BigchainDB.Transaction.makeOutput(
                BigchainDB.Transaction
                    .makeEd25519Condition(token.creator.publicKey),
                (token.tokensLeft - amount).toString()),
                BigchainDB.Transaction.makeOutput(
                    BigchainDB.Transaction
                        .makeEd25519Condition(receiver.publicKey),
                    amount.toString())
            ],
            null
        )

        return postTransaction(tx).then(tx => {
            token.tokensLeft -= amount
            return tx
        })
    })
}
