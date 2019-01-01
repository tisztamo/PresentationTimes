import { me, postTransaction, getTransaction } from "./chain.js"
import {listOutputs} from "./chain";

export let selectedToken = null

export function tokenLaunch(nTokens=1000000) {
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
        selectedToken = {
            id: res.id,
            tokensLeft: nTokens,
            creator: creator,
            createTx: res,
            issue: function(receiver, amount) {
                return giveTokens(this, receiver, amount)
            }
        }
        return selectedToken
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

//TODO filter by token type
export function getOwnedTokens(publicKey) {
    return listOutputs(publicKey).then(outputs => {
        return Promise.all(outputs.map(output => getTransaction(output.transaction_id))).then(txs => {
            let total = 0;
            for (let i = 0; i < outputs.length; i++) {
                const amount = txs[i].outputs[outputs[i].output_index].amount
                total += Number(amount)
            }
            return {
                total,
                transactions: txs
            }
        })
    })
}