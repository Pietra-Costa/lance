--
-- PostgreSQL database dump
--

\restrict 53qdUOIATsnu2xJk5AEn4W6fhgOr43mTKyNowjOcyWx0CNZmAQOku9EkDbz5aJI

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: AuditChainState; Type: TABLE DATA; Schema: public; Owner: lance
--

COPY public."AuditChainState" (id, "lastSequence", "lastEventHash", "checkpointHash", signature, "anchoredAt", "updatedAt") FROM stdin;
global	24	3692b94a10adeadafbf6a12ad67e871a2577591b855065ee305063f99ce75127	\N	\N	\N	2026-10-28 18:15:02.881
\.


--
-- Data for Name: AuditEvent; Type: TABLE DATA; Schema: public; Owner: lance
--

COPY public."AuditEvent" (id, "eventType", "entityType", "entityId", payload, "previousHash", "eventHash", "anchorReference", "createdAt", sequence) FROM stdin;
cmvqyxlx60008q4vukot0pdhf	LOT_CREATED	LOT	cmvqyxlwp0006q4vu5svnddhm	{"sellerId": "cmvqywje90000q4vuewxlfmcm", "catalogItemId": "cmvqyxlvi0004q4vujq0d8p0v"}	\N	c484eb3e834acb599712f893e149230db64bf1f69821c3664a23526673b5f2ed	\N	2026-10-27 17:37:38.105	1
cmvqzg7et0001fovulmrj2676	LOT_LIVE	LOT	cmvqyxlwp0006q4vu5svnddhm	{"actorId": "cmvqywje90000q4vuewxlfmcm"}	c484eb3e834acb599712f893e149230db64bf1f69821c3664a23526673b5f2ed	0a85f7e4d10ff6dedfb99e15335fcbf83afd4a08a97b942733bf03f9bba2cec7	\N	2026-10-27 17:52:05.764	2
cmvr0jujk0009fovumsn411wl	BID_PLACED	LOT	cmvqyxlwp0006q4vu5svnddhm	{"bidId": "cmvr0juj90007fovug95bmizk", "lotId": "cmvqyxlwp0006q4vu5svnddhm", "bidderId": "cmvqzgro40003fovutjv2fd9s", "amountCents": 1500000, "reservationId": "cmvr0jujc0008fovutju8fw1m", "previousReservationId": null}	0a85f7e4d10ff6dedfb99e15335fcbf83afd4a08a97b942733bf03f9bba2cec7	52ff9cc74cb36a0fa33394204f36f120d2ee0cb56e047532cf8c902abbaa6050	\N	2026-10-27 18:22:55.328	3
cmvrhcwlb00055gvubje94e85	BID_PLACED	LOT	cmvqyxlwp0006q4vu5svnddhm	{"bidId": "cmvrhcwkg00035gvu6po9fs75", "lotId": "cmvqyxlwp0006q4vu5svnddhm", "bidderId": "cmvrgl1e60001ecvudmni7pro", "amountCents": 1800000, "reservationId": "cmvrhcwkq00045gvun9aiqzni", "previousReservationId": "cmvr0jujc0008fovutju8fw1m"}	52ff9cc74cb36a0fa33394204f36f120d2ee0cb56e047532cf8c902abbaa6050	9636c4ab3a661e65e2e2d3dbe613e2390a90afa7054c868f532e7fe5d0e64781	\N	2026-10-28 02:13:24.862	4
cmvrhd6yn000a5gvue06o10fo	BID_PLACED	LOT	cmvqyxlwp0006q4vu5svnddhm	{"bidId": "cmvrhd6yg00085gvujt1ypzcl", "lotId": "cmvqyxlwp0006q4vu5svnddhm", "bidderId": "cmvqzgro40003fovutjv2fd9s", "amountCents": 2100000, "reservationId": "cmvrhd6yi00095gvuc05emde4", "previousReservationId": "cmvrhcwkq00045gvun9aiqzni"}	9636c4ab3a661e65e2e2d3dbe613e2390a90afa7054c868f532e7fe5d0e64781	769d63ab1ed70c9cf547914df452c6c4b4e3d3b5cfcd6e3d356d7ee80f9e7575	\N	2026-10-28 02:13:38.303	5
cmvrhgmeg0006ikvu3m5bhfw3	BID_PLACED	LOT	cmvqyxlwp0006q4vu5svnddhm	{"bidId": "cmvrhgmdz0002ikvumpgwb8mj", "lotId": "cmvqyxlwp0006q4vu5svnddhm", "bidderId": "cmvrgl1e60001ecvudmni7pro", "amountCents": 2200000, "reservationId": "cmvrhgme60005ikvuymurpg1a", "previousReservationId": "cmvrhd6yi00095gvuc05emde4"}	769d63ab1ed70c9cf547914df452c6c4b4e3d3b5cfcd6e3d356d7ee80f9e7575	88f6c2537fe4fa71637c2aacd4945d69c8998db760bdd94e0f7a1194f442c351	\N	2026-10-28 02:16:18.279	6
cmvrhgw6n000dikvu30e2ozhs	BID_PLACED	LOT	cmvqyxlwp0006q4vu5svnddhm	{"bidId": "cmvrhgw6d0009ikvutubo1v69", "lotId": "cmvqyxlwp0006q4vu5svnddhm", "bidderId": "cmvqzgro40003fovutjv2fd9s", "amountCents": 2300000, "reservationId": "cmvrhgw6h000cikvukeb3yxuu", "previousReservationId": "cmvrhgme60005ikvuymurpg1a"}	88f6c2537fe4fa71637c2aacd4945d69c8998db760bdd94e0f7a1194f442c351	7e8148ac742beca09a2ff8884fc8bfe5f2c390e038925333c7611158eaae3cdf	\N	2026-10-28 02:16:30.959	7
cmvrhw0af00027wvusuqmwkjo	LOT_CANCELED	LOT	cmvqyxlwp0006q4vu5svnddhm	{"reason": "dsaaaaaaaa", "actorId": "cmvqywje90000q4vuewxlfmcm"}	7e8148ac742beca09a2ff8884fc8bfe5f2c390e038925333c7611158eaae3cdf	bd4ca70f115c1ebb54e353280ef55f08c52dc7b848bcd91365b71cfa18327c7b	\N	2026-10-28 02:28:16.118	8
cmvrif1bk0004wgvufafscwiq	LOT_CREATED	LOT	cmvrif1b50002wgvuea1lfyz5	{"title": "Girassol", "actorId": "cmvqywje90000q4vuewxlfmcm", "sellerId": "cmvqywje90000q4vuewxlfmcm", "actorName": "Ana Teste", "catalogItemId": "cmvrif19d0000wgvu25jgzel3"}	bd4ca70f115c1ebb54e353280ef55f08c52dc7b848bcd91365b71cfa18327c7b	6be6a934a96b29189162591deb20464cdf1603ceb92f984f6bc618b193711679	\N	2026-10-28 02:43:03.919	9
cmvrif9wc0006wgvubxbfztyo	LOT_LIVE	LOT	cmvrif1b50002wgvuea1lfyz5	{"actorId": "cmvqywje90000q4vuewxlfmcm"}	6be6a934a96b29189162591deb20464cdf1603ceb92f984f6bc618b193711679	5671c6f275a79828b4442d65d4534069d70c7e94d165741fdb194d8adad82f1f	\N	2026-10-28 02:43:15.035	10
cmvrirt5c0005eovucdve5odp	BID_PLACED	LOT	cmvrif1b50002wgvuea1lfyz5	{"bidId": "cmvrirt4u0002eovux1kqsn08", "lotId": "cmvrif1b50002wgvuea1lfyz5", "bidderId": "cmvrgl1e60001ecvudmni7pro", "amountCents": 1500000, "reservationId": "cmvrirt4z0004eovuovb6r08l", "previousReservationId": null}	5671c6f275a79828b4442d65d4534069d70c7e94d165741fdb194d8adad82f1f	6af8a84dc766e457a1d38d22b240f77e60e8c3547582b32df7d8db7af696738b	\N	2026-10-28 02:52:59.855	11
cmvrj01ck0002tovusujxwqup	LOT_CANCELED	LOT	cmvrif1b50002wgvuea1lfyz5	{"reason": "ghfdhfdfgdfg", "actorId": "cmvqywje90000q4vuewxlfmcm"}	6af8a84dc766e457a1d38d22b240f77e60e8c3547582b32df7d8db7af696738b	4a2adb79a6ef37de4e45b1d4067aec223fa13fca11ec1fb2af17b11229ea0445	\N	2026-10-28 02:59:23.731	12
cmvrj0ick0008tovu1kc61tge	LOT_CREATED	LOT	cmvrj0ic70006tovu8xnsl9gf	{"title": "Mortar", "actorId": "cmvqywje90000q4vuewxlfmcm", "sellerId": "cmvqywje90000q4vuewxlfmcm", "actorName": "Ana Teste", "catalogItemId": "cmvrj0ib20004tovur2eiwdmv"}	4a2adb79a6ef37de4e45b1d4067aec223fa13fca11ec1fb2af17b11229ea0445	546df7fc5fb914e286f449bb27585f43173444f95847b5f8ac0a27872f7e4510	\N	2026-10-28 02:59:45.764	13
cmvrj0kg1000atovudfdf4jwi	LOT_LIVE	LOT	cmvrj0ic70006tovu8xnsl9gf	{"actorId": "cmvqywje90000q4vuewxlfmcm"}	546df7fc5fb914e286f449bb27585f43173444f95847b5f8ac0a27872f7e4510	0efdce6961c2cb6bcd0997239e509c940354cb5edd80808455b17ea890450016	\N	2026-10-28 02:59:48.481	14
cmvrj0xie000htovup793m1yi	BID_PLACED	LOT	cmvrj0ic70006tovu8xnsl9gf	{"bidId": "cmvrj0xi2000etovuecv91con", "lotId": "cmvrj0ic70006tovu8xnsl9gf", "bidderId": "cmvqzgro40003fovutjv2fd9s", "amountCents": 1700000, "reservationId": "cmvrj0xi6000gtovur8mqg9c2", "previousReservationId": null}	0efdce6961c2cb6bcd0997239e509c940354cb5edd80808455b17ea890450016	16905c7c379a30e8dc55aa86eb5b4bf7fb59f7dff4f19b6a176161ebc7ea308e	\N	2026-10-28 03:00:05.414	15
cmvsafb9h00001gvuo97wzyfh	AUCTION_ENDED	LOT	cmvrj0ic70006tovu8xnsl9gf	{"lotId": "cmvrj0ic70006tovu8xnsl9gf", "endedAt": "2026-10-28T15:47:06.044Z", "winningBidId": "cmvrj0xi2000etovuecv91con"}	16905c7c379a30e8dc55aa86eb5b4bf7fb59f7dff4f19b6a176161ebc7ea308e	c25a204f916bf1fb0593c80494f147447a3b10351d0108e97a1a1bac6ab67d8c	\N	2026-10-28 15:47:06.05	16
cmvsafb9t00011gvull8zezd7	AUCTION_WON	LOT	cmvrj0ic70006tovu8xnsl9gf	{"lotId": "cmvrj0ic70006tovu8xnsl9gf", "winnerId": "cmvqzgro40003fovutjv2fd9s", "amountCents": 1700000, "winningBidId": "cmvrj0xi2000etovuecv91con"}	c25a204f916bf1fb0593c80494f147447a3b10351d0108e97a1a1bac6ab67d8c	d1f7a12da309dc1f1d4447415ef7fb135d0e98ce3771653b3e095abd1afdfc01	\N	2026-10-28 15:47:06.064	17
cmvsafbb500061gvuw61e67eq	SETTLEMENT_COMPLETED	LOT	cmvrj0ic70006tovu8xnsl9gf	{"receiptId": "cmvsafbay00051gvu3zhc2t77", "amountCents": 1700000, "settlementId": "cmvsafba100021gvud5sfyaz9"}	d1f7a12da309dc1f1d4447415ef7fb135d0e98ce3771653b3e095abd1afdfc01	04c2221333784c496e55434cc140469fc1aafba757213aa37e8a7c23ffa0d4a2	\N	2026-10-28 15:47:06.113	18
cmvsedtjq0005ucvu88hnxgim	LOT_CREATED	LOT	cmvsedtj70003ucvuafboxl23	{"title": "Irish Jaunting Car", "actorId": "cmvqywje90000q4vuewxlfmcm", "sellerId": "cmvqywje90000q4vuewxlfmcm", "actorName": "Ana Teste", "catalogItemId": "cmvsedthm0001ucvu0nzqeemn"}	04c2221333784c496e55434cc140469fc1aafba757213aa37e8a7c23ffa0d4a2	bfcc7bb3c58b310223935ac1385ce9495e09b71a99b8e832db27087b510f0e0c	\N	2026-10-28 17:37:54.901	19
cmvsedvq60007ucvuh2plz06l	LOT_LIVE	LOT	cmvsedtj70003ucvuafboxl23	{"actorId": "cmvqywje90000q4vuewxlfmcm"}	bfcc7bb3c58b310223935ac1385ce9495e09b71a99b8e832db27087b510f0e0c	4f6a6665da46fe9d4b5b64d4e037dfb85bd9c5cbe24cad502be6c602fb8e2374	\N	2026-10-28 17:37:57.726	20
cmvseeg70000eucvuvk57u012	BID_PLACED	LOT	cmvsedtj70003ucvuafboxl23	{"bidId": "cmvseeg6q000bucvuw62s8r3m", "lotId": "cmvsedtj70003ucvuafboxl23", "bidderId": "cmvrgl1e60001ecvudmni7pro", "amountCents": 1600000, "reservationId": "cmvseeg6u000ducvudf8er48o", "previousReservationId": null}	4f6a6665da46fe9d4b5b64d4e037dfb85bd9c5cbe24cad502be6c602fb8e2374	11cb54c49807580ff84186387e57a8306269e00d9dcaa469790f2de2be9c5661	\N	2026-10-28 17:38:24.252	21
cmvseg6b4000nucvua2a23reh	BID_PLACED	LOT	cmvsedtj70003ucvuafboxl23	{"bidId": "cmvseg6ax000jucvu74i61e45", "lotId": "cmvsedtj70003ucvuafboxl23", "bidderId": "cmvqzgro40003fovutjv2fd9s", "amountCents": 1700000, "reservationId": "cmvseg6b0000mucvuboszl06t", "previousReservationId": "cmvseeg6u000ducvudf8er48o"}	11cb54c49807580ff84186387e57a8306269e00d9dcaa469790f2de2be9c5661	af70df03ce87197d829973585dab368f804448c781b38bf71d1f381d69938b67	\N	2026-10-28 17:39:44.752	22
cmvsfnxdv000akwvuoo4mzohq	BID_PLACED	LOT	cmvsf05lt000dwwvuubf9lzfa	{"bidId": "cmvsfnxd80006kwvunz4d96y5", "lotId": "cmvsf05lt000dwwvuubf9lzfa", "bidderId": "cmvsf05hl0001wwvui8j7ul43", "amountCents": 12000, "reservationId": "cmvsfnxdh0009kwvumevsoxj5", "previousReservationId": "cmvsf05ms000iwwvun2fpnveg"}	af70df03ce87197d829973585dab368f804448c781b38bf71d1f381d69938b67	c95f46e5a84f18ebebe21002b33e26f01c71705af3959cffdc09b1efd7a87aa6	\N	2026-10-28 18:13:46.05	23
cmvsfpko0000ekwvuclol11fw	LOT_LIVE	LOT	cmvsf05na000jwwvur66v0b5e	{"actorId": "cmvsf05gc0000wwvuoujgz3zz"}	c95f46e5a84f18ebebe21002b33e26f01c71705af3959cffdc09b1efd7a87aa6	3692b94a10adeadafbf6a12ad67e871a2577591b855065ee305063f99ce75127	\N	2026-10-28 18:15:02.879	24
\.


--
-- Name: AuditEvent_sequence_seq; Type: SEQUENCE SET; Schema: public; Owner: lance
--

SELECT pg_catalog.setval('public."AuditEvent_sequence_seq"', 24, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 53qdUOIATsnu2xJk5AEn4W6fhgOr43mTKyNowjOcyWx0CNZmAQOku9EkDbz5aJI

