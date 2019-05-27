// Copyright 2018 Energy Web Foundation
// This file is part of the Origin Application brought to you by the Energy Web Foundation,
// a global non-profit organization focused on accelerating blockchain technology across the energy sector,
// incorporated in Zug, Switzerland.
//
// The Origin Application is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// This is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY and without an implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details, at <http://www.gnu.org/licenses/>.
//
// @authors: slock.it GmbH; Heiko Burkhardt, heiko.burkhardt@slock.it; Martin Kuechler, martin.kuchler@slock.it

import * as React from 'react';

import marker from '../../assets/marker.svg';
import map from '../../assets/map.svg';
import wind from '../../assets/icon_wind.svg';
import hydro from '../../assets/icon_hydro.svg';
import solar from '../../assets/icon_solar.svg';
import moment from 'moment';
import { Link } from 'react-router-dom';
import * as OriginIssuer from 'ew-origin-lib';
import * as EwUser from 'ew-user-registry-lib';
import * as EwAsset from 'ew-asset-registry-lib';
import { MapContainer } from './MapContainer';

import './DetailView.scss';
import { getOffChainText } from '../utils/Helper';
import { Configuration } from 'ew-utils-general-lib';

export interface DetailViewProps {
    conf: Configuration.Entity;
    id: number;
    baseUrl: string;
    certificates: OriginIssuer.Certificate.Entity[];
    producingAssets: EwAsset.ProducingAsset.Entity[];
    addSearchField: boolean;
}

export interface DetailViewState {
    newId: number;
    owner: EwUser.User;
    notSoldCertificates: number;
}

const TableWidth = [210, 210, 210, 210, 407];

export class ProducingAssetDetailView extends React.Component<DetailViewProps, DetailViewState> {
    constructor(props: DetailViewProps) {
        super(props);
        this.state = {
            newId: null,
            owner: null,
            notSoldCertificates: 0
        };
        this.onInputChange = this.onInputChange.bind(this);
    }

    onInputChange(e: any): void {
        this.setState({ newId: e.target.value });
    }

    async componentDidMount(): Promise<void> {
        await this.getOwner(this.props);
    }

    async componentWillReceiveProps(newProps: DetailViewProps): Promise<void> {
        await this.getOwner(newProps);
    }

    async getOwner(props: DetailViewProps): Promise<void> {
        if (props.id !== null && props.id !== undefined) {
            const selectedAsset = props.producingAssets.find(
                (p: EwAsset.ProducingAsset.Entity) => p.id === props.id.toString()
            );
            if (selectedAsset) {
                if (this.props.certificates.length > 0) {
                    this.setState({
                        notSoldCertificates: this.props.certificates
                            .map((certificate: OriginIssuer.Certificate.Entity) =>
                                certificate.owner === selectedAsset.owner.address &&
                                certificate.assetId.toString() === selectedAsset.id
                                    ? certificate.powerInW
                                    : 0
                            )
                            .reduce((a, b) => a + b)
                    });
                }
                this.setState({
                    owner: await new EwUser.User(
                        selectedAsset.owner.address,
                        props.conf as any
                    ).sync()
                });
            }
        }
    }

    render(): JSX.Element {
        const selectedAsset: EwAsset.ProducingAsset.Entity =
            this.props.id !== null && this.props.id !== undefined
                ? this.props.producingAssets.find(
                      (p: EwAsset.ProducingAsset.Entity) => p.id === this.props.id.toString()
                  )
                : null;
        let data;
        if (selectedAsset) {
            data = [
                [
                    {
                        label: 'Asset Owner',
                        data: this.state.owner ? this.state.owner.organization : ''
                    },
                    {
                        label:
                            'Certified by Registry' +
                            getOffChainText('complianceRegistry', selectedAsset.offChainProperties),
                        data:
                            EwAsset.ProducingAsset.Compliance[
                                selectedAsset.offChainProperties.complianceRegistry
                            ]
                    },
                    {
                        label:
                            'Meter Read' +
                            getOffChainText(
                                'lastSmartMeterReadWh',
                                selectedAsset.offChainProperties
                            ),
                        data: (selectedAsset.lastSmartMeterReadWh / 1000).toLocaleString(),
                        tip: 'kWh'
                    },

                    {
                        label:
                            'Geo Location' +
                            getOffChainText('gpsLatitude', selectedAsset.offChainProperties),
                        data:
                            selectedAsset.offChainProperties.gpsLatitude +
                            ', ' +
                            selectedAsset.offChainProperties.gpsLongitude,
                        image: map,
                        type: 'map',
                        rowspan: 3,
                        colspan: 2
                    }
                ],
                [
                    {
                        label:
                            'Asset Type' +
                            getOffChainText('assetType', selectedAsset.offChainProperties),
                        data:
                            EwAsset.ProducingAsset.Type[selectedAsset.offChainProperties.assetType],
                        image:
                            EwAsset.ProducingAsset.Type.Wind ===
                            selectedAsset.offChainProperties.assetType
                                ? wind
                                : EwAsset.ProducingAsset.Type.Solar ===
                                  selectedAsset.offChainProperties.assetType
                                ? solar
                                : hydro,
                        rowspan: 2
                    },
                    {
                        label:
                            'Other Green Attributes' +
                            getOffChainText(
                                'otherGreenAttributes',
                                selectedAsset.offChainProperties
                            ),
                        data: selectedAsset.offChainProperties.otherGreenAttributes
                    },
                    {
                        label:
                            'Commissioning Date' +
                            getOffChainText('operationalSince', selectedAsset.offChainProperties),
                        data: moment(
                            selectedAsset.offChainProperties.operationalSince * 1000
                        ).format('DD MMM YY')
                    }
                ],
                [
                    {
                        label:
                            'Public Support' +
                            getOffChainText(
                                'typeOfPublicSupport',
                                selectedAsset.offChainProperties
                            ),
                        data: selectedAsset.offChainProperties.typeOfPublicSupport,
                        description: ''
                    },
                    {
                        label:
                            'Nameplate Capacity' +
                            getOffChainText('capacityWh', selectedAsset.offChainProperties),
                        data: (selectedAsset.offChainProperties.capacityWh / 1000).toLocaleString(),
                        tip: 'kW'
                    }
                ]
            ];
        }

        const pageBody = (
            <div className="PageBody">
                {!selectedAsset ? (
                    <div className="text-center">
                        <strong>Asset not found</strong>
                    </div>
                ) : (
                    <table>
                        <tbody>
                            {data.map((row: any) => (
                                <tr key={row.key}>
                                    {row.map((col, cIndex) => {
                                        if (
                                            col.isAdditionalInformation &&
                                            !this.props.addSearchField
                                        ) {
                                            return null;
                                        }

                                        return (
                                            <td
                                                key={col.key}
                                                rowSpan={col.rowspan || 1}
                                                colSpan={col.colspan || 1}
                                            >
                                                <div className="Label">{col.label}</div>
                                                <div className="Data">
                                                    {col.data} {col.tip && <span>{col.tip}</span>}
                                                </div>
                                                {col.image &&
                                                    (col.type !== 'map' ? (
                                                        <div className={`Image`}>
                                                            <img src={col.image} />
                                                            {col.type === 'map' && (
                                                                <img
                                                                    src={marker as any}
                                                                    className="Marker"
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className={`Image Map`}>
                                                            <MapContainer asset={selectedAsset} />
                                                        </div>
                                                    ))}
                                                {col.description && (
                                                    <div className="Description">
                                                        {col.description}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        );

        return (
            <div>
                {this.props.addSearchField ? (
                    <div className="DetailViewWrapper">
                        <div className="FindAsset">
                            <input
                                onChange={this.onInputChange}
                                defaultValue={
                                    this.props.id || this.props.id === 0
                                        ? this.props.id.toString()
                                        : ''
                                }
                            />

                            <Link
                                className="btn btn-primary find-asset-button"
                                to={`/${this.props.baseUrl}/assets/producing_detail_view/${
                                    this.state.newId
                                }`}
                            >
                                Find Asset
                            </Link>
                        </div>
                        <div className="PageContentWrapper">
                            {/* <div className='PageHeader'>
                <div className='PageTitle'>Berlin II, <span>Berlin, Germany</span></div>
              </div> */}
                            {pageBody}
                        </div>
                    </div>
                ) : (
                    pageBody
                )}
            </div>
        );
    }
}

const addCommas = intNum => {
    return (intNum + '').replace(/(\d)(?=(\d{3})+$)/g, '$1,');
};