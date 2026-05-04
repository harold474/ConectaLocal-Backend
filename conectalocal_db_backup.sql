--
-- PostgreSQL database dump
--

\restrict h5jaWK4EyyayTlbahccRmbrINiF9gGrTo3M6COt25jT2y8WcqJ3qroyEZKD7IgA

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: detalle_pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_pedidos (
    id integer NOT NULL,
    pedido_id integer,
    producto_id integer,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL
);


ALTER TABLE public.detalle_pedidos OWNER TO postgres;

--
-- Name: detalle_pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_pedidos_id_seq OWNER TO postgres;

--
-- Name: detalle_pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_pedidos_id_seq OWNED BY public.detalle_pedidos.id;


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    consumidor_id integer,
    fecha_pedido timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(10,2) NOT NULL,
    estado character varying(50) DEFAULT 'pendiente'::character varying,
    tipo_entrega character varying(20) DEFAULT 'domicilio'::character varying,
    direccion_envio character varying(255),
    barrio_envio character varying(100),
    telefono_contacto character varying(20)
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_id_seq OWNER TO postgres;

--
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    precio numeric(10,2) NOT NULL,
    categoria character varying(100),
    imagenes text[] DEFAULT '{}'::text[],
    stock integer DEFAULT 0,
    productor_id integer
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO postgres;

--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    rol character varying(50) NOT NULL,
    nombre_negocio character varying(255),
    direccion character varying(255),
    barrio character varying(100),
    foto_perfil character varying(255),
    apellidos character varying(100),
    telefono character varying(20),
    ciudad character varying(100),
    preferencias text
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: detalle_pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedidos ALTER COLUMN id SET DEFAULT nextval('public.detalle_pedidos_id_seq'::regclass);


--
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: detalle_pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_pedidos (id, pedido_id, producto_id, cantidad, precio_unitario) FROM stdin;
\.


--
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (id, consumidor_id, fecha_pedido, total, estado, tipo_entrega, direccion_envio, barrio_envio, telefono_contacto) FROM stdin;
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos (id, nombre, descripcion, precio, categoria, imagenes, stock, productor_id) FROM stdin;
4	Portatil	portatl lenovo nuevo	1200000.00	Tecnologia	{/uploads/1777801064515.jpg}	2	4
5	Portatil lenovo thinpak	portatil	1300000.00	Tecnologia	{/uploads/1777801094143.jpg}	1	4
6	Tablet	tablet lonovo 	800000.00	Alimentos	{/uploads/1777801119095.jpg}	2	4
7	Portatil Asus	tablet color dorada	700000.00	Tecnologia	{/uploads/1777801175192.jpg}	10	4
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, email, password, rol, nombre_negocio, direccion, barrio, foto_perfil, apellidos, telefono, ciudad, preferencias) FROM stdin;
1	ana	ana@ejemplo.com	$2b$10$EGv/kHyH6LqRHTKfbfqYjOlSEDK/pQV9yzeFl6NS6lrTxtH5sshlK	consumidor				\N	\N	\N	\N	\N
3	johana	johana@ejemplo.com	$2b$10$YqmYKs/PMIl21IlNIG16ueX0skx3FWBjIzKF.t8AoomlHlJ446kCa	productor	Brillo&Glamour	carrera 31 N 15165	ciudad verde	\N	\N	\N	\N	\N
4	Daniel	daniducon@gmail.com	$2b$10$dkPlJNxNZ7xhfq6n.jQYw.tX9RO.D4cwBPzLBiV3G/u31QRidayNi	productor	tech tinker	carrera 31 N 15165	ciudad verde	\N	\N	\N	\N	\N
2	Harold	haduconab@gmail.com	$2b$10$cCpgiQ.hbr9LMChPVZGVAeYkmjnP/s.bwA84RXf8DZoqbqQLRawB.	consumidor				/uploads/1777591149916.jpeg				
\.


--
-- Name: detalle_pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_pedidos_id_seq', 1, false);


--
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 1, false);


--
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_seq', 7, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 4, true);


--
-- Name: detalle_pedidos detalle_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedidos
    ADD CONSTRAINT detalle_pedidos_pkey PRIMARY KEY (id);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: detalle_pedidos detalle_pedidos_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedidos
    ADD CONSTRAINT detalle_pedidos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- Name: detalle_pedidos detalle_pedidos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedidos
    ADD CONSTRAINT detalle_pedidos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: pedidos pedidos_consumidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_consumidor_id_fkey FOREIGN KEY (consumidor_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: productos productos_productor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_productor_id_fkey FOREIGN KEY (productor_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict h5jaWK4EyyayTlbahccRmbrINiF9gGrTo3M6COt25jT2y8WcqJ3qroyEZKD7IgA

