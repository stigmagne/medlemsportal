export interface BrregRole {
    type: {
        kode: string;
        beskrivelse: string;
    };
    person?: {
        fodselsdato: string;
        navn: {
            fornavn: string;
            etternavn: string;
            mellomnavn?: string;
        };
        erDoed: boolean;
    };
    enhet?: {
        organisasjonsnummer: string;
        navn: string;
        organisasjonsform: {
            kode: string;
            beskrivelse: string;
        };
    };
    fratraadt: boolean;
    rekkefolge: number;
}

export interface BrregRolesResponse {
    rollegrupper: {
        type: {
            kode: string;
            beskrivelse: string;
        };
        roller: BrregRole[];
    }[];
}

export async function getOrganizationRoles(orgNr: string) {
    try {
        const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${orgNr}/roller`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch roles: ${response.statusText}`);
        }

        const data: BrregRolesResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching generic Brreg roles', error);
        return null;
    }
}

export async function getOrganizationDetails(orgNr: string) {
    try {
        const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${orgNr}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching org details', error);
        return null;
    }
}

export interface KeyRoles {
    dagligLeder?: BrregRole;
    styretsLeder?: BrregRole;
}

export function findKeyRoles(roles: BrregRolesResponse): KeyRoles {
    const result: KeyRoles = {};

    if (!roles || !roles.rollegrupper) return result;

    // Iterate through all groups and roles to find the specific role codes
    // DAGL = Daglig leder
    // LEDE = Styrets leder

    for (const group of roles.rollegrupper) {
        for (const role of group.roller) {
            if (role.type.kode === 'DAGL') {
                result.dagligLeder = role;
            } else if (role.type.kode === 'LEDE') {
                result.styretsLeder = role;
            }
        }
    }

    return result;
}
