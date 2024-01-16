import { PROFILE_METADATA } from "./deploy-profile/input"
import {Profile} from '@dcl/schemas'

export async function main() {
    const result = Profile.validate(PROFILE_METADATA)

    if (!result) {
        console.log({ result: Profile.validate.errors})
    }
}

main().catch(console.error)