import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  Table,
  Icon,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useMemo, useState } from "react";
import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from "react-table";

// Custom components
import Card from "components/card/Card";
import Menu from "components/menu/MainMenu";
import UpdateOrderModal from "./UpdateOrderModal";
import CreateOrderModal from "./CreateOrderModal";

// Assets
import { MdCheckCircle, MdCancel, MdOutlineError } from "react-icons/md";

function Orders(props) {
  const { columnsData, tableData, onOrderCreated, onDateSelect, productsAvailable } = props;

  const columns = useMemo(() => columnsData, [columnsData]);
  const data = useMemo(() => tableData, [tableData]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);


  const onOrderCreatedCallback = (newOrder) => {
    onOrderCreated(newOrder);
  };

  const isButtonDisabled = () => {
    return data.length === 0 || data.some(row => row.status !== 'Creada' || row.errors.length > 0);
  };

  const handleScheduleButtonClick = async () => {
    setIsScheduling(true);

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    try {
      const response = await axios.post('https://vas516y582.execute-api.us-east-1.amazonaws.com/development/schedule-orders', { date: formattedDate });
      console.log('Scheduled successfully:', response.data);
      setAlertMessage({ type: 'success', text: 'Las ordenes fueron programadas con éxito' });
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error('Error scheduling:', error);
      setAlertMessage({ type: 'error', text: 'Error al programar ordenes. Intenta de nuevo.' });
      setTimeout(() => setAlertMessage(null), 3000);
    } finally {
      setIsScheduling(false);
    }
  };

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [selectedRowData, setSelectedRowData] = useState(null);

  const openUpdateModal = (row) => {
    setSelectedRowData(row);
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setSelectedRowData(null);
    setIsUpdateModalOpen(false);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const tableInstance = useTable(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    initialState,
  } = tableInstance;
  initialState.pageSize = 5;

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  return (
    <>
      {alertMessage && (
        <motion.div
          initial={{ x: '100%', right: '8px', top: '20%' }}
          animate={{ x: 0, right: '8px', top: '20%' }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            zIndex: 1000,
          }}
        >
          <Alert status={alertMessage.type} mb={4}>
            <AlertIcon />
            {alertMessage.text}
          </Alert>
        </motion.div>
      )}
      <Card
        direction="column"
        w="100%"
        px="0px"
        overflowX={{ sm: "scroll", lg: "hidden" }}
      >
        <Flex px="25px" justify="space-between" mb="20px" align="center">
          <Text color={textColor} fontSize="22px" fontWeight="700" lineHeight="100%">
            Pedidos para hoy
          </Text>
          <Flex align="center">
            <Menu onDateSelect={onDateSelect} />
            <Button variant="action" ml="4" onClick={openCreateModal}>
              Crear
            </Button>
          </Flex>
        </Flex>
        {data.length === 0 ? (
          <Box mt="4" px="4">
            <Text color={textColor}>
              No hay registros para mostrar.
            </Text>
          </Box>
        ) : (
          <Table {...getTableProps()} variant="simple" color="gray.500" mb="24px">
            <Thead>
              {headerGroups.map((headerGroup, index) => (
                <Tr {...headerGroup.getHeaderGroupProps()} key={index}>
                  {headerGroup.headers.map((column, index) => (
                    <Th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      pe="10px"
                      key={index}
                      cursor="pointer"
                      borderColor={borderColor}
                    >
                      <Flex
                        justify="space-between"
                        align="center"
                        fontSize={{ sm: "10px", lg: "12px" }}
                        color="gray.400"
                      >
                        {column.render("Header")}
                      </Flex>
                    </Th>
                  ))}
                </Tr>
              ))}
            </Thead>
            <Tbody {...getTableBodyProps()}>
              {page.map((row, index) => {
                prepareRow(row);
                const totalAmount = row.original.cart_items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                );
                const formattedTotalAmount = totalAmount.toLocaleString('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                });
                const tooltipContent = (
                  <Table variant="simple" key={index}>
                    <Thead>
                      <Tr>
                        <Th>Producto</Th>
                        <Th>Cantidad</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {row.original.cart_items.map((item, itemIndex) => (
                        <Tr key={itemIndex}>
                          <Td>{item.product}</Td>
                          <Td>{item.price.toLocaleString('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                          })}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                );
                const tooltipErrorContent = (
                  <Table variant="simple" key={index}>
                    <Thead>
                      <Tr>
                        <Th>Errores</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {row.original.errors.length > 0 ? (
                        row.original.errors.map((error, errorIndex) => (
                          <Tr key={errorIndex}>
                            <Td>{error.value}</Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={1}>No hay errores</Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                );

                return (
                  <Tr
                    {...row.getRowProps()}
                    key={index}
                    onClick={() => openUpdateModal(row.original)} // Open modal on row click
                    cursor="pointer"
                  >
                    {row.cells.map((cell, index) => {
                      let data = "";
                      if (cell.column.Header === "NOMBRE") {
                        data = (
                          <Text color={textColor} fontSize="sm" fontWeight="700">
                            {cell.value}
                          </Text>
                        );
                      } else if (cell.column.Header === "STATUS") {
                        data = (
                          <Flex align="center">
                            <Icon
                              w="24px"
                              h="24px"
                              me="5px"
                              color={
                                (cell.value === "Programada" || cell.value === "Creada" || cell.value === "En ruta")
                                  ? "green.500"
                                  : cell.value === "Error"
                                    ? "red.500"
                                    : cell.value === "Reprogramar"
                                      ? "orange.500"
                                      : null
                              }
                              as={
                                (cell.value === "Programada" || cell.value === "Creada" || cell.value === "En ruta")
                                  ? MdCheckCircle
                                  : cell.value === "Reprogramar"
                                    ? MdOutlineError
                                    : cell.value === "Error"
                                      ? MdCancel
                                      : null
                              }
                            />
                            {cell.value === "Error" ? (
                              <Tooltip label={tooltipErrorContent} hasArrow placement="top" arrowSize={10}>
                                <Text color={textColor} fontSize="sm" fontWeight="700">
                                  {cell.value}
                                </Text>
                              </Tooltip>
                            ) : (
                              <Text color={textColor} fontSize="sm" fontWeight="700">
                                {cell.value}
                              </Text>
                            )}
                          </Flex>
                        );
                      } else if (cell.column.Header === "HORARIO") {
                        data = (
                          <Text color={textColor} fontSize="sm" fontWeight="700">
                            {cell.value}
                          </Text>
                        );
                      } else if (cell.column.Header === 'PEDIDO') {
                        data = (
                          <Tooltip label={tooltipContent} hasArrow placement="top" arrowSize={10}>
                            <Text color={textColor} fontSize="sm" fontWeight="700">
                              {cell.value}
                            </Text>
                          </Tooltip>
                        );
                      } else if (cell.column.Header === "MONTO TOTAL") {
                        data = (
                          <Text color={textColor} fontSize="sm" fontWeight="700">
                            {formattedTotalAmount}
                          </Text>
                        );
                      } else if (cell.column.Header === "MÉTODO DE PAGO") {
                        data = (
                          <Text color={textColor} fontSize="sm" fontWeight="700">
                            {cell.value}
                          </Text>
                        );
                      } else if (cell.column.Header === "DIRECCIÓN") {
                        data = (
                          <Text color={textColor} fontSize="sm" fontWeight="700">
                            {cell.value}
                          </Text>
                        );
                      } else if (cell.column.Header === "FECHA") {
                        data = (
                          <Text color={textColor} fontSize="sm" fontWeight="700">
                            {cell.value}
                          </Text>
                        );
                      } else if (cell.column.Header === "REPARTIDOR") {
                        data = (
                          <Text color={textColor} fontSize="sm" fontWeight="700">
                            {cell.value}
                          </Text>
                        );
                      } else if (cell.column.Header === "SECUENCIA") {
                        data = (
                          <Text color={textColor} fontSize="sm" fontWeight="700">
                            {cell.value !== null ? (
                              <>{cell.value}</>
                            ) : (
                              <>---</>
                            )}
                          </Text>
                        );
                      }
                      return (
                        <Td
                          {...cell.getCellProps()}
                          key={index}
                          fontSize={{ sm: "14px" }}
                          minW={{ sm: "150px", md: "200px", lg: "auto" }}
                          borderColor="transparent"
                        >
                          {data}
                        </Td>
                      );
                    })}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
        {isUpdateModalOpen && (
          <UpdateOrderModal
            isOpen={isUpdateModalOpen}
            onClose={closeUpdateModal}
            rowData={selectedRowData}
          />
        )}
        {isCreateModalOpen && (
          <CreateOrderModal
            isOpen={isCreateModalOpen}
            onClose={closeCreateModal}
            onCreate={onOrderCreatedCallback}
            productsAvailable={productsAvailable}
          />
        )}
        <Button
          variant="action"
          mt="4"
          onClick={handleScheduleButtonClick}
          isDisabled={isScheduling || isButtonDisabled()}
          isLoading={isScheduling}
          spinnerPlacement="end"
        >
          Programar pedidos para ir a ruta
        </Button>
      </Card>
    </>
  );
}

export default Orders;