import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import { analyticsService } from '../services/analyticsService';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState(30);
  const [salesTrends, setSalesTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topFarmers, setTopFarmers] = useState([]);
  const [geoDistribution, setGeoDistribution] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [trends, products, farmers, geo, stats, growth] = await Promise.all([
        analyticsService.getSalesTrends(timeRange),
        analyticsService.getTopProducts(10),
        analyticsService.getTopFarmers(10),
        analyticsService.getGeographicDistribution(),
        analyticsService.getOrderStats(timeRange),
        analyticsService.getUserGrowth(timeRange)
      ]);

      setSalesTrends(trends);
      setTopProducts(products);
      setTopFarmers(farmers);
      setGeoDistribution(geo);
      setOrderStats(stats);
      setUserGrowth(growth);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const salesChartData = {
    labels: salesTrends.map(d => d.date),
    datasets: [
      {
        label: 'Revenue (₦)',
        data: salesTrends.map(d => d.revenue),
        borderColor: 'rgb(40, 167, 69)',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.4
      },
      {
        label: 'Orders',
        data: salesTrends.map(d => d.orders),
        borderColor: 'rgb(0, 123, 255)',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const salesChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Revenue (₦)' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Orders' },
        grid: { drawOnChartArea: false }
      }
    }
  };

  const topProductsChartData = {
    labels: topProducts.slice(0, 5).map(p => p.productName),
    datasets: [{
      label: 'Revenue (₦)',
      data: topProducts.slice(0, 5).map(p => p.totalRevenue),
      backgroundColor: [
        'rgba(40, 167, 69, 0.8)',
        'rgba(0, 123, 255, 0.8)',
        'rgba(255, 193, 7, 0.8)',
        'rgba(220, 53, 69, 0.8)',
        'rgba(108, 117, 125, 0.8)'
      ]
    }]
  };

  const geoChartData = {
    labels: geoDistribution.slice(0, 10).map(g => g.state),
    datasets: [{
      label: 'Users',
      data: geoDistribution.slice(0, 10).map(g => g.count),
      backgroundColor: 'rgba(40, 167, 69, 0.6)',
      borderColor: 'rgba(40, 167, 69, 1)',
      borderWidth: 1
    }]
  };

  const handleExport = (data, filename) => {
    analyticsService.exportToCSV(data, filename);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success"></div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><i className="bi bi-graph-up me-2"></i>Analytics Dashboard</h1>
        <Form.Select 
          value={timeRange} 
          onChange={(e) => setTimeRange(Number(e.target.value))}
          style={{width: 'auto'}}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </Form.Select>
      </div>

      {/* Order Stats */}
      {orderStats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="stat-card shadow-sm border-primary">
              <Card.Body>
                <div className="stat-value text-primary">{orderStats.total}</div>
                <div className="stat-label">Total Orders</div>
                <small className="text-muted">
                  {orderStats.completed} completed
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm border-success">
              <Card.Body>
                <div className="stat-value text-success">
                  ₦{(orderStats.totalRevenue / 1000).toFixed(1)}K
                </div>
                <div className="stat-label">Total Revenue</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm border-info">
              <Card.Body>
                <div className="stat-value text-info">
                  ₦{(orderStats.averageOrderValue / 1).toFixed(0)}
                </div>
                <div className="stat-label">Avg Order Value</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm border-warning">
              <Card.Body>
                <div className="stat-value text-warning">
                  {orderStats.total > 0 
                    ? ((orderStats.completed / orderStats.total) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="stat-label">Completion Rate</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Sales Trends Chart */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Sales Trends</h5>
              <Button 
                size="sm" 
                variant="outline-success"
                onClick={() => handleExport(salesTrends, 'sales_trends')}
              >
                <i className="bi bi-download me-1"></i>Export
              </Button>
            </Card.Header>
            <Card.Body>
              <Line data={salesChartData} options={salesChartOptions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        {/* Top Products */}
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Top Products</h5>
              <Button 
                size="sm" 
                variant="outline-success"
                onClick={() => handleExport(topProducts, 'top_products')}
              >
                <i className="bi bi-download me-1"></i>Export
              </Button>
            </Card.Header>
            <Card.Body>
              <Bar data={topProductsChartData} />
              <Table hover className="mt-3 mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.slice(0, 5).map((product, idx) => (
                    <tr key={idx}>
                      <td>{product.productName}</td>
                      <td>{product.totalOrders}</td>
                      <td>₦{product.totalRevenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Geographic Distribution */}
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Geographic Distribution</h5>
              <Button 
                size="sm" 
                variant="outline-success"
                onClick={() => handleExport(geoDistribution, 'geographic_distribution')}
              >
                <i className="bi bi-download me-1"></i>Export
              </Button>
            </Card.Header>
            <Card.Body>
              <Bar data={geoChartData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Farmers */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Top Performing Farmers</h5>
              <Button 
                size="sm" 
                variant="outline-success"
                onClick={() => handleExport(topFarmers, 'top_farmers')}
              >
                <i className="bi bi-download me-1"></i>Export
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Farmer</th>
                    <th>Total Orders</th>
                    <th>Total Revenue</th>
                    <th>Avg Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {topFarmers.map((farmer, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{farmer.farmerName || farmer.farmerId}</td>
                      <td>{farmer.totalOrders}</td>
                      <td>₦{farmer.totalRevenue.toLocaleString()}</td>
                      <td>₦{(farmer.totalRevenue / farmer.totalOrders).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AnalyticsDashboard;
