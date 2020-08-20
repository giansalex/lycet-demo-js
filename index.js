const axios = require('axios').default;
const fs = require('fs');

async function main() {

    const tokenApi = '123456';
    const lycetApi = axios.create({
        baseURL: 'http://localhost:8000/',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json'
        }
    });

    const invoice = {
        ublVersion: '2.1',
        tipoOperacion: '0101', // Venta - Catalogo.51
        tipoDoc: '01', // Factura - Catalogo.01
        serie: 'F001',
        correlativo: '111',
        fechaEmision: '2020-08-19T12:34:00-05:00',
        tipoMoneda: 'PEN',
        company: {
            ruc: '20123456789',
            razonSocial: 'LYCET COMPANY SAC',
            nombreComercial: 'LYCET',
            address: {
                ubigueo: '150101',
                departamento: 'LIMA',
                provincia: 'LIMA',
                distrito: 'LIMA',
                urbanizacion: '-',
                direccion: 'AV ITALIA',
                codigoPais: 'PE',
            }
        },
        client: {
            tipoDoc: '6', // RUC - Catalogo.06
            numDoc: '20546687668',
            rznSocial: 'COMPANY SAC'
        },
        mtoOperGravadas: 100,
        mtoIGV: 18,
        totalImpuestos: 18,
        valorVenta: 100,
        subTotal: 118,
        mtoImpVenta: 118,
        details: [
            {
                unidad: 'NIU', // Unidades - Catalogo.03
                cantidad: 1,
                codProducto: 'P001',
                descripcion: 'PRODUCTO 1',
                mtoValorUnitario: 100,
                mtoBaseIgv: 100,
                porcentajeIgv: 18,
                igv: 18,
                tipAfeIgv: '10', // Gravado Operación Onerosa - Catalogo.07
                totalImpuestos: 18,
                mtoPrecioUnitario: 118,
                mtoValorVenta: 100
            }
        ],
        legends: [
            {
                code: '1000',
                value: 'SON CIENTO DIECIOCHO CON 00/100 SOLES'
            }
        ]
    };

    try {
        const apiResponse = await lycetApi.post('api/v1/invoice/send?token=' + tokenApi, invoice);
        const billResult = apiResponse.data;

        console.log('Guardando XML en 20123456789-01-F001-111.xml');
        await saveFile('20123456789-01-F001-111.xml', billResult.xml);
        console.log('Valor Resumen (Hash):', billResult.hash)

        if (!billResult.sunatResponse.success) {
            // Error al conectarse a SUNAT, o EXCEPCIONES enviadas por SUNAT por errores en el XML
            console.log(billResult.sunatResponse.error);
            return;
        }

        console.log('Guardando CDR en R-20123456789-01-F001-111.zip');
        await saveFile('R-20123456789-01-F001-111.zip', billResult.sunatResponse.cdrZip, 'base64');
        const cdrResult = billResult.sunatResponse.cdrResponse;

        const codigoCdr = parseInt(cdrResult.code);
        if (codigoCdr === 0) {
            console.log('ESTADO: ACEPTADA');
        } else if (codigoCdr >= 4000) {
            console.log('ESTADO: ACEPTADA CON OBSERVACIONES:');
            console.log(cdrResult.notes)
        } else {
            console.log('ESTADO: RECHAZADA');
        }

        console.log('RESULTADO DESCRIPCION SUNAT: ', cdrResult.description);

    } catch (e) {
        console.log(e);
    }
}

function saveFile(path, content, format = 'utf8') {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, format, function (err) {
            if (err) {
                return reject(err);
            }

            resolve(true);
        });
    });
}

main();